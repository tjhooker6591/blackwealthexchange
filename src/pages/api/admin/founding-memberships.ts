import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { FOUNDING_MEMBERSHIP_PRODUCT_KEY } from "@/lib/founding-membership";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (!["GET", "POST"].includes(req.method || "")) {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    if (req.method === "POST") {
      const action = String(req.body?.action || "").trim();
      const claimId = String(req.body?.claimId || "").trim();
      const membershipId = String(req.body?.membershipId || "").trim();
      const reason = String(req.body?.reason || "").trim();
      const evidenceSubmission =
        req.body?.evidenceSubmission &&
        typeof req.body?.evidenceSubmission === "object"
          ? req.body.evidenceSubmission
          : null;
      const allowedActions = new Set([
        "approve",
        "request_additional_evidence",
        "reject",
        "mark_disputed",
        "reopen",
        "submit_evidence",
      ]);
      if (!allowedActions.has(action) || !membershipId) {
        return res
          .status(400)
          .json({ ok: false, error: "invalid_action_or_membership" });
      }

      const review = await db
        .collection("ownership_reviews")
        .findOne({ sourceMembershipId: membershipId });
      const claim = await db
        .collection("business_claims")
        .findOne(claimId ? { _id: claimId as any } : { membershipId });
      const membership = await db
        .collection("business_memberships")
        .findOne({ membershipId });
      if (!claim || !review || !membership) {
        return res.status(404).json({ ok: false, error: "claim_not_found" });
      }

      const adminEmail = String(admin.email || admin.userId || "admin");
      const previousStatus =
        String(
          review.reviewStatus ||
            claim.ownershipReviewStatus ||
            membership.ownershipReviewStatus ||
            "",
        ).trim() || null;
      let resultingStatus = previousStatus || "ownership_review_pending";
      let claimStatus = String(claim.claimStatus || "claim_pending");
      let claimLocked = true;
      let claimStage = "ownership_review_pending";
      let managementAccess = "locked_pending_review";
      let evidenceStatus = review.evidenceStatus || "awaiting_owner_documents";

      if (action === "approve") {
        resultingStatus = "ownership_approved";
        claimStatus = "ownership_approved";
        claimStage = "ownership_verified";
        managementAccess = "approved";
        evidenceStatus = review.evidenceStatus || "evidence_verified";
        claimLocked = true;
      } else if (action === "request_additional_evidence") {
        resultingStatus = "additional_evidence_required";
        claimStatus = "additional_evidence_required";
        claimStage = "additional_evidence_required";
        managementAccess = "locked_pending_review";
        evidenceStatus = "awaiting_additional_evidence";
      } else if (action === "reject") {
        resultingStatus = "ownership_rejected";
        claimStatus = "ownership_rejected";
        claimStage = "unclaimed";
        managementAccess = "rejected";
        evidenceStatus = review.evidenceStatus || "reviewed";
        claimLocked = false;
      } else if (action === "mark_disputed") {
        resultingStatus = "disputed";
        claimStatus = "disputed";
        claimStage = "disputed";
        managementAccess = "locked_pending_review";
        evidenceStatus = review.evidenceStatus || "disputed";
      } else if (action === "reopen") {
        resultingStatus = "ownership_review_pending";
        claimStatus = "ownership_review_pending";
        claimStage = "ownership_review_pending";
        managementAccess = "locked_pending_review";
        evidenceStatus = review.evidenceStatus || "awaiting_owner_documents";
        claimLocked = true;
      } else if (action === "submit_evidence") {
        resultingStatus = previousStatus || "ownership_review_pending";
        claimStatus = claim.claimStatus || "claim_pending";
        claimStage = "ownership_review_pending";
        managementAccess = "locked_pending_review";
        evidenceStatus = "evidence_submitted";
        claimLocked = true;
      }

      const auditEntry = {
        action,
        reviewer: adminEmail,
        previousStatus,
        resultingStatus,
        reason: reason || null,
        timestamp: new Date(),
      };

      const reviewUpdate: any = {
        $set: {
          reviewStatus: resultingStatus,
          sourceClaimStatus: claimStatus,
          evidenceStatus,
          reviewer: adminEmail,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        },
        $push: {
          auditHistory: auditEntry,
        },
      };

      if (evidenceSubmission) {
        reviewUpdate.$push.evidenceSubmissions = {
          type: String(evidenceSubmission.type || "other"),
          notes: String(evidenceSubmission.notes || "").slice(0, 2000),
          submittedAt: new Date(),
          submittedBy: adminEmail,
          storageKey: String(evidenceSubmission.storageKey || ""),
          redactedLabel: String(
            evidenceSubmission.redactedLabel || "Evidence submitted",
          ),
        };
      }

      await db
        .collection("ownership_reviews")
        .updateOne({ sourceMembershipId: membershipId }, reviewUpdate);

      await db.collection("business_claims").updateOne(
        { membershipId },
        {
          $set: {
            claimStatus,
            ownershipReviewStatus: resultingStatus,
            claimLocked,
            reviewer: adminEmail,
            reviewReason: reason || null,
            reviewedAt: new Date(),
            updatedAt: new Date(),
          },
          $push: { auditHistory: auditEntry } as any,
        },
      );

      await db.collection("business_memberships").updateOne(
        { membershipId },
        {
          $set: {
            ownershipReviewStatus: resultingStatus,
            managementAccessStatus: managementAccess,
            updatedAt: new Date(),
          },
        },
      );

      await db.collection("membership_fulfillment").updateOne(
        { membershipId },
        {
          $set: {
            ownershipAccessStatus: managementAccess,
            updatedAt: new Date(),
          },
        },
      );

      await db.collection("membership_onboarding").updateOne(
        { membershipId },
        {
          $set: {
            nextStep:
              action === "approve"
                ? "ownership approved, unlock business management"
                : action === "request_additional_evidence"
                  ? "submit additional ownership evidence"
                  : action === "reject"
                    ? "claim closed"
                    : "ownership review in progress",
            evidencePortalStatus:
              action === "approve"
                ? "complete"
                : action === "reject"
                  ? "closed"
                  : "open",
            updatedAt: new Date(),
          },
        },
        { upsert: true },
      );

      await db.collection("businesses").updateOne(
        { _id: membership.businessId as any },
        {
          $set: {
            claimStage,
            ownershipReviewStatus: resultingStatus,
            claimLocked,
            claimedByUserId: action === "approve" ? membership.userId : null,
            managedByUserId: action === "approve" ? membership.userId : null,
            updatedAt: new Date(),
          },
          ...(action === "approve"
            ? { $addToSet: { ownerUserIds: membership.userId } }
            : {}),
        },
      );

      await db.collection("users").updateOne(
        {
          $or: [{ _id: membership.userId as any }, { email: membership.email }],
        },
        {
          $set: {
            claimedBusinessId:
              action === "approve" ? membership.businessId : null,
            foundingMembershipId: membershipId,
            foundingOwnershipStatus: resultingStatus,
            updatedAt: new Date(),
          },
        },
      );

      return res
        .status(200)
        .json({ ok: true, updated: true, resultingStatus, claimStatus });
    }

    const [memberships, claims, reviews, fulfillment, onboarding] =
      await Promise.all([
        db
          .collection("business_memberships")
          .find({ productKey: FOUNDING_MEMBERSHIP_PRODUCT_KEY })
          .sort({ updatedAt: -1, createdAt: -1 })
          .limit(100)
          .toArray(),
        db
          .collection("business_claims")
          .find({ productKey: FOUNDING_MEMBERSHIP_PRODUCT_KEY })
          .sort({ updatedAt: -1, createdAt: -1 })
          .limit(100)
          .toArray(),
        db
          .collection("ownership_reviews")
          .find({
            sourceMembershipId: {
              $regex: `^${FOUNDING_MEMBERSHIP_PRODUCT_KEY}:`,
            },
          })
          .sort({ updatedAt: -1, createdAt: -1 })
          .limit(100)
          .toArray(),
        db
          .collection("membership_fulfillment")
          .find({
            membershipId: { $regex: `^${FOUNDING_MEMBERSHIP_PRODUCT_KEY}:` },
          })
          .sort({ updatedAt: -1, createdAt: -1 })
          .limit(100)
          .toArray(),
        db
          .collection("membership_onboarding")
          .find({
            membershipId: { $regex: `^${FOUNDING_MEMBERSHIP_PRODUCT_KEY}:` },
          })
          .sort({ updatedAt: -1, createdAt: -1 })
          .limit(100)
          .toArray(),
      ]);

    return res.status(200).json({
      ok: true,
      memberships,
      claims,
      reviews,
      fulfillment,
      onboarding,
    });
  } catch (error) {
    console.error("[admin/founding-memberships]", error);
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}
