import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import {
  buildEntityClaimTransition,
  ensureActiveOwnershipLink,
  newAuditEntry,
  ENTITY_CLAIM_PENDING,
} from "@/lib/entityClaims";

function redactId(value: unknown) {
  const text = String(value || "").trim();
  if (!text) return null;
  if (text.length <= 8) return text;
  return `${text.slice(0, 4)}…${text.slice(-4)}`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const admin = await requireAdminFromRequest(req, res);
  if (!admin) {
    console.info("[admin/organizations/claims] deny", {
      routeDecision: "deny",
      denialReasonCategory: "admin_auth_failed",
      method: req.method,
    });
    return;
  }

  console.info("[admin/organizations/claims] auth", {
    routeDecision: "allow_candidate",
    method: req.method,
    authenticatedUserId: redactId((admin as any).userId),
    resolvedRole: (admin as any).isAdmin
      ? "admin"
      : String((admin as any).accountType || (admin as any).role || "unknown"),
  });

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    if (req.method === "GET") {
      const claims = await db
        .collection("entity_claims")
        .find({ entityType: "organization" })
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(200)
        .toArray();
      return res.status(200).json({ ok: true, claims });
    }

    if (req.method !== "POST") {
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).json({ ok: false, error: "method_not_allowed" });
    }

    const claimId = String(req.body?.claimId || "").trim();
    const action = String(req.body?.action || "").trim();
    const reason = String(req.body?.reason || "").trim();
    const transition = buildEntityClaimTransition(action);

    if (!claimId || !transition) {
      console.info("[admin/organizations/claims] deny", {
        routeDecision: "deny",
        denialReasonCategory: "invalid_claim_action",
        authenticatedUserId: redactId((admin as any).userId),
        resolvedRole: (admin as any).isAdmin
          ? "admin"
          : String(
              (admin as any).accountType || (admin as any).role || "unknown",
            ),
      });
      return res.status(400).json({ ok: false, error: "invalid_claim_action" });
    }

    const claim = await db
      .collection("entity_claims")
      .findOne({ _id: new ObjectId(claimId) });
    if (!claim || claim.entityType !== "organization") {
      console.info("[admin/organizations/claims] deny", {
        routeDecision: "deny",
        denialReasonCategory: "claim_not_found",
        authenticatedUserId: redactId((admin as any).userId),
        resolvedRole: (admin as any).isAdmin
          ? "admin"
          : String(
              (admin as any).accountType || (admin as any).role || "unknown",
            ),
        claimId: redactId(claimId),
      });
      return res.status(404).json({ ok: false, error: "claim_not_found" });
    }

    const previousStatus = String(claim.claimStatus || ENTITY_CLAIM_PENDING);
    const auditEntry = newAuditEntry({
      action,
      actorUserId: String((admin as any).userId || "") || null,
      actorEmail: String((admin as any).email || "") || null,
      reason: reason || null,
      fromStatus: previousStatus,
      toStatus: transition.claimStatus,
    });

    await db.collection("entity_claims").updateOne(
      { _id: new ObjectId(claimId) },
      {
        $set: {
          claimStatus: transition.claimStatus,
          verificationStatus: transition.verificationStatus,
          statusChangeReason: reason || null,
          updatedAt: new Date(),
          verifiedAt:
            action === "verify" ? new Date() : claim.verifiedAt || null,
          failedAt:
            action === "verification_failed"
              ? new Date()
              : claim.failedAt || null,
          verifyingAdministratorId: String((admin as any).userId || "") || null,
          verificationReviewId: claimId,
          requestMoreEvidenceState: action === "request_more_evidence",
          disputeState: action === "mark_disputed" ? "disputed" : null,
          revocationState: action === "revoke" ? "revoked" : null,
        },
        $push: { auditHistory: auditEntry } as any,
      },
    );

    if (action === "verify") {
      await ensureActiveOwnershipLink(db, {
        entityType: "organization",
        entityId: String(claim.entityId),
        userId: String(claim.claimantUserId),
        claimId,
        adminUserId: String((admin as any).userId || "") || null,
        adminEmail: String((admin as any).email || "") || null,
      });
    }

    if (action === "revoke") {
      await db.collection("entity_ownerships").updateMany(
        {
          entityType: "organization",
          entityId: String(claim.entityId),
          userId: String(claim.claimantUserId),
          status: "active",
        },
        {
          $set: {
            status: "revoked",
            revokedAt: new Date(),
            updatedAt: new Date(),
          },
          $push: {
            auditHistory: newAuditEntry({
              action: "revoke",
              actorUserId: String((admin as any).userId || "") || null,
              actorEmail: String((admin as any).email || "") || null,
              reason: reason || null,
              fromStatus: "active",
              toStatus: "revoked",
            }),
          } as any,
        },
      );
    }

    console.info("[admin/organizations/claims] success", {
      routeDecision: "allow",
      action,
      authenticatedUserId: redactId((admin as any).userId),
      resolvedRole: (admin as any).isAdmin
        ? "admin"
        : String(
            (admin as any).accountType || (admin as any).role || "unknown",
          ),
      claimId: redactId(claimId),
      resultingStatus: transition.claimStatus,
    });
    return res
      .status(200)
      .json({ ok: true, claimId, status: transition.claimStatus });
  } catch (error) {
    console.error("[admin/organizations/claims]", error);
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}
