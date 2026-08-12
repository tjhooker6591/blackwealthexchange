import type { NextApiRequest, NextApiResponse } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { getJwtSecret, getMongoDbName } from "@/lib/env";
import clientPromise from "@/lib/mongodb";
import {
  buildFoundingClaimIntakeRecord,
  getFoundingClaimIntakeFieldAudit,
  normalizeFoundingClaimStage,
} from "@/lib/founding-membership";

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function getAuthenticatedMembership(req: NextApiRequest) {
  const cookies = cookie.parse(req.headers.cookie || "");
  const token = cookies.session_token;
  if (!token) return null;

  const decoded = jwt.verify(token, getJwtSecret()) as any;
  const userId = String(decoded?.userId || "").trim();
  const email = String(decoded?.email || "")
    .trim()
    .toLowerCase();
  if (!userId && !email) return null;

  const client = await clientPromise;
  const db = client.db(getMongoDbName());
  const membership = await db.collection("business_memberships").findOne(
    {
      productKey: "founding_verified_business_growth_membership",
      membershipStatus: { $in: ["active", "past_due", "cancelled"] },
      $or: [{ userId }, { email }],
    },
    { sort: { updatedAt: -1, createdAt: -1 } },
  );

  if (!membership) return null;

  const business = await db.collection("businesses").findOne({
    $or: [
      { _id: membership.businessId as any },
      { _id: String(membership.businessId) as any },
    ],
  });
  const review = await db
    .collection("ownership_reviews")
    .findOne({ sourceMembershipId: membership.membershipId });
  const claim = await db
    .collection("business_claims")
    .findOne({ membershipId: membership.membershipId });
  const onboarding = await db
    .collection("membership_onboarding")
    .findOne({ membershipId: membership.membershipId });
  const user = await db.collection("users").findOne(
    { $or: [{ _id: membership.userId as any }, { email }] },
    {
      projection: { firstName: 1, lastName: 1, name: 1, email: 1, phone: 1 },
    },
  );

  return {
    db,
    membership,
    business,
    review,
    claim,
    onboarding,
    user,
    userId,
    email,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (!["GET", "POST"].includes(req.method || "")) {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  try {
    const context = await getAuthenticatedMembership(req);
    if (!context) {
      return res.status(401).json({ ok: false, error: "unauthorized" });
    }

    const {
      db,
      membership,
      business,
      review,
      claim: _claim,
      onboarding,
      user,
      userId,
      email,
    } = context;
    const existingClaimIntake = (review as any)?.claimIntake || null;

    if (req.method === "GET") {
      const claimIntake = buildFoundingClaimIntakeRecord({
        business,
        claimantUserId: membership.userId
          ? String(membership.userId)
          : userId || null,
        claimantValues: {
          businessName:
            existingClaimIntake?.business?.businessName
              ?.claimantProvidedValue ||
            business?.business_name ||
            membership.membershipName,
          addressLine1:
            existingClaimIntake?.business?.addressLine1
              ?.claimantProvidedValue ||
            business?.address ||
            business?.streetAddress ||
            "",
          city:
            existingClaimIntake?.business?.city?.claimantProvidedValue ||
            business?.city ||
            "",
          state:
            existingClaimIntake?.business?.state?.claimantProvidedValue ||
            business?.state ||
            "",
          postalCode:
            existingClaimIntake?.business?.postalCode?.claimantProvidedValue ||
            business?.zip ||
            business?.postalCode ||
            "",
          phone:
            existingClaimIntake?.business?.phone?.claimantProvidedValue ||
            business?.phone ||
            "",
          website:
            existingClaimIntake?.business?.website?.claimantProvidedValue ||
            business?.website ||
            "",
          businessEmail:
            existingClaimIntake?.business?.businessEmail
              ?.claimantProvidedValue ||
            business?.email ||
            "",
          socialUrls:
            existingClaimIntake?.business?.socialUrls?.map(
              (item: any) => item.claimantProvidedValue,
            ) ||
            [
              business?.instagram,
              business?.facebook,
              business?.linkedin,
              business?.twitter,
            ]
              .filter(Boolean)
              .join("\n"),
          claimantName:
            existingClaimIntake?.claimant?.claimantName ||
            [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
            user?.name ||
            "",
          claimantEmail:
            existingClaimIntake?.claimant?.claimantEmail ||
            email ||
            user?.email ||
            "",
          claimantPhone:
            existingClaimIntake?.claimant?.claimantPhone || user?.phone || "",
          relationshipToBusiness:
            existingClaimIntake?.claimant?.relationshipToBusiness || "",
          roleTitle: existingClaimIntake?.claimant?.roleTitle || "",
        },
        evidence:
          (review as any)?.structuredEvidenceSubmissions ||
          (review as any)?.evidenceSubmissions ||
          [],
        existingRecord: existingClaimIntake,
      });

      return res.status(200).json({
        ok: true,
        membership: {
          membershipId: membership.membershipId,
          membershipName: membership.membershipName,
          reviewStatus:
            normalizeFoundingClaimStage(
              review?.reviewStatus || membership.ownershipReviewStatus,
            ) || null,
          evidencePortalStatus: onboarding?.evidencePortalStatus || null,
        },
        currentListing: {
          businessName: stringOrNull(business?.business_name),
          addressLine1: stringOrNull(
            business?.address || business?.streetAddress,
          ),
          city: stringOrNull(business?.city),
          state: stringOrNull(business?.state),
          postalCode: stringOrNull(business?.zip || business?.postalCode),
          phone: stringOrNull(business?.phone),
          website: stringOrNull(business?.website),
          businessEmail: stringOrNull(business?.email),
          socialUrls: [
            business?.instagram,
            business?.facebook,
            business?.linkedin,
            business?.twitter,
          ]
            .filter(Boolean)
            .map((item) => String(item)),
        },
        claimIntake,
        fieldAudit: getFoundingClaimIntakeFieldAudit(),
        legacyVerified:
          normalizeFoundingClaimStage(
            review?.reviewStatus || membership.ownershipReviewStatus,
          ) === "ownership_verified" && !existingClaimIntake,
      });
    }

    const payload = req.body && typeof req.body === "object" ? req.body : {};
    const claimIntake = buildFoundingClaimIntakeRecord({
      business,
      claimantUserId: membership.userId
        ? String(membership.userId)
        : userId || null,
      claimantValues: payload.claimantValues || {},
      evidence: Array.isArray(payload.evidence) ? payload.evidence : [],
      existingRecord: existingClaimIntake,
    });

    const legacyEvidenceSubmissions = claimIntake.evidence.map((item) => ({
      type: item.evidenceType,
      notes: item.notes || "",
      submittedAt: item.submittedAt,
      submittedBy: membership.userId || userId || "claimant",
      storageKey: item.storageKey,
      redactedLabel: item.redactedLabel,
      purpose: item.purpose,
      validationState: item.validationState,
      reviewState: item.reviewState,
      matchedSignals: item.matchedSignals,
    }));

    await db.collection("ownership_reviews").updateOne(
      { sourceMembershipId: membership.membershipId },
      {
        $set: {
          claimIntake,
          structuredEvidenceSubmissions: claimIntake.evidence,
          evidenceSubmissions: legacyEvidenceSubmissions,
          evidenceStatus: claimIntake.evidence.length
            ? "evidence_submitted"
            : review?.evidenceStatus || "awaiting_owner_documents",
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );

    await db.collection("business_claims").updateOne(
      { membershipId: membership.membershipId },
      {
        $set: {
          proposedBusinessProfile: claimIntake.business,
          claimantProfile: claimIntake.claimant,
          authorityProfile: claimIntake.authority,
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );

    await db.collection("membership_onboarding").updateOne(
      { membershipId: membership.membershipId },
      {
        $set: {
          evidencePortalStatus: "open",
          nextStep: claimIntake.evidence.length
            ? "ownership evidence submitted for review"
            : "submit ownership evidence for ownership verification",
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );

    return res.status(200).json({
      ok: true,
      saved: true,
      claimIntake,
    });
  } catch (error) {
    console.error("[founding-membership/evidence]", error);
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}
