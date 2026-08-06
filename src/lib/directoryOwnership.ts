import type { NextApiRequest } from "next";
import jwt from "jsonwebtoken";
import { ObjectId, type Db, type Filter } from "mongodb";
import { getJwtSecret } from "@/lib/env";

export type SessionIdentity = {
  userId: string;
  email: string;
  accountType?: string;
  isAdmin?: boolean;
};

export type OwnershipRecord = {
  entityType: "business" | "organization";
  entityId: string;
  userId: string;
  claimId?: string | null;
  reviewId?: string | null;
  claimStatus?: string | null;
  verificationStatus?: string | null;
  status?: string | null;
  disputeState?: string | null;
  revokedAt?: Date | string | null;
  revokedReason?: string | null;
  source?: string;
};

export function isOwnershipBlocked(record: {
  disputeState?: unknown;
  revokedAt?: unknown;
}) {
  const normalizedDispute = normalizeStage(record?.disputeState);
  return (
    Boolean(record?.revokedAt) ||
    normalizedDispute === "disputed" ||
    normalizedDispute === "ownership_disputed"
  );
}

export function normalizeStage(value: unknown) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");

  if (!normalized) return "";
  if (normalized === "verify" || normalized === "verified") {
    return "ownership_verified";
  }
  if (normalized === "pending_claim_verification") {
    return "ownership_verification_pending";
  }
  return normalized;
}

export function parseSessionIdentity(
  req: NextApiRequest,
): SessionIdentity | null {
  const token = req.cookies.session_token;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, getJwtSecret()) as {
      userId?: string;
      email?: string;
      accountType?: string;
      isAdmin?: boolean;
    };

    const userId = String(payload.userId || "").trim();
    const email = String(payload.email || "")
      .trim()
      .toLowerCase();

    if (!userId || !email) return null;
    return {
      userId,
      email,
      accountType: payload.accountType,
      isAdmin: payload.isAdmin === true,
    };
  } catch {
    return null;
  }
}

export function buildObjectIdOrStringFilter(
  key: string,
  id: string,
): Filter<any> | null {
  const trimmed = String(id || "").trim();
  if (!trimmed) return null;
  if (ObjectId.isValid(trimmed) && String(new ObjectId(trimmed)) === trimmed) {
    return {
      $or: [{ [key]: new ObjectId(trimmed) }, { [key]: trimmed }],
    } as any;
  }
  return { [key]: trimmed } as any;
}

async function _findVerifiedBusinessOwnership(
  db: Db,
  userId: string,
  businessId: string,
): Promise<OwnershipRecord | null> {
  const businessFilter = buildObjectIdOrStringFilter("_id", businessId);
  if (!businessFilter) return null;

  const business = await db.collection("businesses").findOne({
    $and: [
      businessFilter,
      {
        $or: [
          { claimedByUserId: userId },
          { managedByUserId: userId },
          { ownerUserIds: userId },
        ],
      },
      {
        claimStage: { $in: ["ownership_verified", "verified"] },
      },
      {
        ownershipReviewStatus: { $in: ["ownership_verified", "verified"] },
      },
    ],
  });

  if (!business) return null;

  const claim = await db.collection("business_claims").findOne({
    userId,
    $and: [buildObjectIdOrStringFilter("businessId", businessId) || {}],
    claimStatus: { $in: ["ownership_verified", "verified"] },
    ownershipReviewStatus: { $in: ["ownership_verified", "verified"] },
    revokedAt: { $exists: false },
  });

  const review = await db.collection("ownership_reviews").findOne({
    userId,
    $and: [buildObjectIdOrStringFilter("businessId", businessId) || {}],
    reviewStatus: { $in: ["ownership_verified", "verified"] },
    revokedAt: { $exists: false },
  });

  if (!claim || !review) return null;

  return {
    entityType: "business",
    entityId: String(business._id),
    userId,
    claimId: String(claim._id || "") || null,
    reviewId: String(review._id || "") || null,
    claimStatus: normalizeStage(claim.claimStatus),
    verificationStatus: normalizeStage(review.reviewStatus),
    status: "ownership_verified",
    disputeState: normalizeStage(claim.disputeState || review.disputeState),
    revokedAt: claim.revokedAt || review.revokedAt || null,
    source: "verified_business_claim",
  };
}

export async function listVerifiedBusinessOwnerships(
  db: Db,
  userId: string,
): Promise<OwnershipRecord[]> {
  const claims = await db
    .collection("business_claims")
    .find(
      {
        userId,
        claimStatus: { $in: ["ownership_verified", "verified"] },
        ownershipReviewStatus: { $in: ["ownership_verified", "verified"] },
        revokedAt: { $exists: false },
      },
      {
        projection: {
          _id: 1,
          businessId: 1,
          claimStatus: 1,
          ownershipReviewStatus: 1,
          disputeState: 1,
          revokedAt: 1,
        },
      },
    )
    .toArray();

  if (!claims.length) return [];

  const reviews = await db
    .collection("ownership_reviews")
    .find(
      {
        userId,
        reviewStatus: { $in: ["ownership_verified", "verified"] },
        revokedAt: { $exists: false },
      },
      {
        projection: {
          _id: 1,
          businessId: 1,
          reviewStatus: 1,
          disputeState: 1,
          revokedAt: 1,
        },
      },
    )
    .toArray();

  const reviewByBusinessId = new Map(
    reviews
      .map(
        (review) => [String((review as any).businessId || ""), review] as const,
      )
      .filter(([businessId]) => Boolean(businessId)),
  );

  const ownerships: OwnershipRecord[] = [];
  for (const claim of claims) {
    const businessId = String((claim as any).businessId || "").trim();
    if (!businessId) continue;

    const review = reviewByBusinessId.get(businessId);
    if (!review) continue;

    const business = await db.collection("businesses").findOne({
      $and: [
        buildObjectIdOrStringFilter("_id", businessId) || {
          _id: businessId as any,
        },
        {
          $or: [
            { claimedByUserId: userId },
            { managedByUserId: userId },
            { ownerUserIds: userId },
          ],
        },
        {
          claimStage: { $in: ["ownership_verified", "verified"] },
        },
        {
          ownershipReviewStatus: { $in: ["ownership_verified", "verified"] },
        },
      ],
    });

    if (!business) continue;

    ownerships.push({
      entityType: "business",
      entityId: String(business._id),
      userId,
      claimId: String((claim as any)._id || "") || null,
      reviewId: String((review as any)._id || "") || null,
      claimStatus: normalizeStage((claim as any).claimStatus),
      verificationStatus: normalizeStage((review as any).reviewStatus),
      status: "ownership_verified",
      disputeState: normalizeStage(
        (claim as any).disputeState || (review as any).disputeState,
      ),
      revokedAt: (claim as any).revokedAt || (review as any).revokedAt || null,
      source: "verified_business_claim",
    });
  }

  return ownerships.filter((ownership) => !isOwnershipBlocked(ownership));
}

export async function resolvePrimaryVerifiedBusinessOwnership(
  db: Db,
  userId: string,
): Promise<OwnershipRecord | null> {
  const ownerships = await listVerifiedBusinessOwnerships(db, userId);
  return ownerships[0] || null;
}

export async function resolveVerifiedOwnership(
  db: Db,
  args: {
    entityType: "business" | "organization";
    entityId: string;
    userId: string;
  },
): Promise<OwnershipRecord | null> {
  const normalizedEntityId = String(args.entityId || "").trim();
  if (!normalizedEntityId) return null;

  if (args.entityType === "business") {
    const ownership = await _findVerifiedBusinessOwnership(
      db,
      args.userId,
      normalizedEntityId,
    );
    if (!ownership) return null;

    if (isOwnershipBlocked(ownership)) {
      return null;
    }

    return ownership;
  }

  if (!normalizedEntityId) return null;

  const claim = await db.collection("entity_claims").findOne({
    entityType: "organization",
    claimantUserId: args.userId,
    entityId: normalizedEntityId,
    claimStatus: "ownership_verified",
    verificationStatus: "ownership_verified",
    revocationState: { $ne: "revoked" },
  });

  if (!claim) return null;

  const link = await db.collection("entity_ownerships").findOne({
    entityType: "organization",
    userId: args.userId,
    entityId: normalizedEntityId,
    status: "active",
    disputeLocked: { $ne: true },
    revokedAt: null,
  });

  if (!link) return null;

  return {
    entityType: "organization",
    entityId: String(link.entityId),
    userId: args.userId,
    claimId: String(claim._id || "") || null,
    reviewId: String(claim.verificationReviewId || "") || null,
    claimStatus: normalizeStage(claim.claimStatus),
    verificationStatus: normalizeStage(claim.verificationStatus),
    status: String(link.status || "active"),
    disputeState: normalizeStage(link.disputeState || claim.disputeState),
    revokedAt: link.revokedAt || claim.revokedAt || null,
    source: "verified_entity_ownership",
  };
}
