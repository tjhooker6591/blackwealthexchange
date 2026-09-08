import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import {
  parseSessionIdentity,
  buildObjectIdOrStringFilter,
} from "@/lib/directoryOwnership";
import { ENTITY_CLAIM_PENDING } from "@/lib/entityClaims";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const session = parseSessionIdentity(req);
  if (!session) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  const entityId = String(
    req.body?.entityId || req.body?.organizationId || "",
  ).trim();
  const evidenceReferences = Array.isArray(req.body?.evidenceReferences)
    ? req.body.evidenceReferences.filter(Boolean)
    : [];
  const reason = String(req.body?.reason || "").trim();

  if (!entityId) {
    return res.status(400).json({ ok: false, error: "entity_id_required" });
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    const organization = await db.collection("organizations").findOne(
      buildObjectIdOrStringFilter("_id", entityId) || {
        _id: entityId as any,
      },
    );

    if (!organization) {
      return res
        .status(404)
        .json({ ok: false, error: "organization_not_found" });
    }

    const existingVerified = await db.collection("entity_ownerships").findOne({
      entityType: "organization",
      entityId: String(organization._id),
      status: "active",
      revokedAt: null,
    });

    if (existingVerified) {
      return res
        .status(409)
        .json({ ok: false, error: "organization_already_has_verified_owner" });
    }

    const now = new Date();
    const claimDoc = {
      entityType: "organization",
      entityId: String(organization._id),
      claimantUserId: session.userId,
      claimantEmail: session.email,
      claimStatus: ENTITY_CLAIM_PENDING,
      verificationStatus: ENTITY_CLAIM_PENDING,
      submittedAt: now,
      verifiedAt: null,
      failedAt: null,
      verifyingAdministratorId: null,
      requestMoreEvidenceState: false,
      evidenceReferences,
      disputeState: null,
      revocationState: null,
      ownershipTransferHistory: [],
      auditHistory: [
        {
          action: "submit_claim",
          actorUserId: session.userId,
          actorEmail: session.email,
          reason: reason || null,
          timestamp: now,
        },
      ],
      statusChangeReason: reason || null,
      verificationReviewId: null,
      createdAt: now,
      updatedAt: now,
    };

    const insertResult = await db
      .collection("entity_claims")
      .insertOne(claimDoc as any);

    return res.status(201).json({
      ok: true,
      claimId: String(insertResult.insertedId),
      status: ENTITY_CLAIM_PENDING,
      entityId: String(organization._id),
    });
  } catch (error) {
    console.error("[organizations/claim]", error);
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}
