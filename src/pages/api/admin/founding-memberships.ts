import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import {
  buildMongoIdOrStringQuery,
  FOUNDING_MEMBERSHIP_PRODUCT_KEY,
  formatUsdFromCents,
  normalizeFoundingClaimStage,
  normalizeFoundingPaymentStatus,
} from "@/lib/founding-membership";

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
        "verify",
        "request_additional_evidence",
        "verification_failed",
        "mark_disputed",
        "reopen_verification",
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
      let resultingStatus = previousStatus || "ownership_verification_pending";
      let claimStatus = String(claim.claimStatus || "claim_initiated");
      let claimLocked = true;
      let claimStage = "ownership_verification_pending";
      let managementAccess = "locked_pending_verification";
      let evidenceStatus = review.evidenceStatus || "awaiting_owner_documents";

      if (action === "verify") {
        resultingStatus = "ownership_verified";
        claimStatus = "ownership_verified";
        claimStage = "ownership_verified";
        managementAccess = "approved";
        evidenceStatus = review.evidenceStatus || "evidence_verified";
        claimLocked = true;
      } else if (action === "request_additional_evidence") {
        resultingStatus = "additional_evidence_required";
        claimStatus = "additional_evidence_required";
        claimStage = "ownership_verification_pending";
        managementAccess = "locked_pending_verification";
        evidenceStatus = "awaiting_additional_evidence";
      } else if (action === "verification_failed") {
        resultingStatus = "ownership_verification_failed";
        claimStatus = "ownership_verification_failed";
        claimStage = "unclaimed";
        managementAccess = "rejected";
        evidenceStatus = review.evidenceStatus || "reviewed";
        claimLocked = false;
      } else if (action === "mark_disputed") {
        resultingStatus = "disputed";
        claimStatus = "disputed";
        claimStage = "ownership_verification_pending";
        managementAccess = "locked_pending_verification";
        evidenceStatus = review.evidenceStatus || "disputed";
      } else if (action === "reopen_verification") {
        resultingStatus = "ownership_verification_pending";
        claimStatus = "claim_initiated";
        claimStage = "ownership_verification_pending";
        managementAccess = "locked_pending_verification";
        evidenceStatus = review.evidenceStatus || "awaiting_owner_documents";
        claimLocked = true;
      } else if (action === "submit_evidence") {
        resultingStatus = previousStatus || "ownership_verification_pending";
        claimStatus = claim.claimStatus || "claim_initiated";
        claimStage = "ownership_verification_pending";
        managementAccess = "locked_pending_verification";
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
              action === "verify"
                ? "ownership verified, unlock business management"
                : action === "request_additional_evidence"
                  ? "submit additional ownership evidence"
                  : action === "verification_failed"
                    ? "verification closed"
                    : "ownership verification in progress",
            evidencePortalStatus:
              action === "verify"
                ? "complete"
                : action === "verification_failed"
                  ? "closed"
                  : "open",
            updatedAt: new Date(),
          },
        },
        { upsert: true },
      );

      await db.collection("businesses").updateOne(
        buildMongoIdOrStringQuery("_id", membership.businessId) || {
          _id: membership.businessId as any,
        },
        {
          $set: {
            claimStage,
            ownershipReviewStatus: resultingStatus,
            claimLocked,
            claimedByUserId: action === "verify" ? membership.userId : null,
            managedByUserId: action === "verify" ? membership.userId : null,
            updatedAt: new Date(),
          },
          ...(action === "verify"
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
              action === "verify" ? membership.businessId : null,
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

    const [memberships, claims, reviews, fulfillment, onboarding, businesses] =
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
        db
          .collection("businesses")
          .find({
            foundingMembershipId: {
              $regex: `^${FOUNDING_MEMBERSHIP_PRODUCT_KEY}:`,
            },
          })
          .project({
            business_name: 1,
            alias: 1,
            slug: 1,
            claimStage: 1,
            claimLocked: 1,
            claimedByUserId: 1,
            claimedByEmail: 1,
            foundingMembershipId: 1,
            ownershipReviewStatus: 1,
          })
          .limit(100)
          .toArray(),
      ]);

    const businessByMembershipId = new Map(
      businesses
        .filter((item) => item?.foundingMembershipId)
        .map((item) => [String(item.foundingMembershipId), item]),
    );
    const membershipById = new Map(
      memberships
        .filter((item) => item?.membershipId)
        .map((item) => [String(item.membershipId), item]),
    );
    const reviewByMembershipId = new Map(
      reviews
        .filter((item) => item?.sourceMembershipId)
        .map((item) => [String(item.sourceMembershipId), item]),
    );

    const normalizedMemberships = memberships.map((membership) => ({
      ...membership,
      paymentStatus: normalizeFoundingPaymentStatus(membership),
      paymentAmount: formatUsdFromCents(
        membership.amountCents || membership.paymentAmountCents || 4900,
      ),
      claimStatus:
        normalizeFoundingClaimStage(membership.claimStatus) ||
        membership.claimStatus ||
        null,
    }));

    const normalizedClaimsByMembershipId = new Map<string, any>();

    for (const claim of claims) {
      const membership = membershipById.get(String(claim.membershipId || ""));
      const linkedBusiness =
        businessByMembershipId.get(String(claim.membershipId || "")) ||
        businessByMembershipId.get(String(membership?.membershipId || "")) ||
        null;
      normalizedClaimsByMembershipId.set(String(claim.membershipId || ""), {
        ...claim,
        claimStatus:
          normalizeFoundingClaimStage(claim.claimStatus) ||
          claim.claimStatus ||
          null,
        ownershipReviewStatus:
          normalizeFoundingClaimStage(claim.ownershipReviewStatus) ||
          claim.ownershipReviewStatus ||
          null,
        businessName:
          linkedBusiness?.business_name || claim.businessName || null,
        businessSlug: linkedBusiness?.alias || linkedBusiness?.slug || null,
      });
    }

    for (const membership of normalizedMemberships) {
      const membershipId = String(membership.membershipId || "");
      if (!membershipId || normalizedClaimsByMembershipId.has(membershipId)) {
        continue;
      }

      const review = reviewByMembershipId.get(membershipId) || null;
      const linkedBusiness = businessByMembershipId.get(membershipId) || null;
      const normalizedReviewStatus = normalizeFoundingClaimStage(
        review?.reviewStatus || membership.ownershipReviewStatus,
      );
      const isPendingQueueItem =
        membership.membershipStatus === "active" &&
        (normalizedReviewStatus === "ownership_verification_pending" ||
          normalizedReviewStatus === "additional_evidence_required" ||
          normalizedReviewStatus === "disputed");

      if (!isPendingQueueItem) continue;

      normalizedClaimsByMembershipId.set(membershipId, {
        _id: `synthetic-claim:${membershipId}`,
        membershipId,
        businessId:
          membership.businessId || linkedBusiness?._id || review?.businessId || null,
        userId: membership.userId || review?.userId || null,
        email: membership.email || review?.email || linkedBusiness?.claimedByEmail || null,
        claimStatus:
          normalizeFoundingClaimStage(membership.claimStatus) ||
          "claim_initiated",
        ownershipReviewStatus:
          normalizedReviewStatus,
        claimLocked: true,
        businessName: linkedBusiness?.business_name || membership.membershipName || null,
        businessSlug: linkedBusiness?.alias || linkedBusiness?.slug || null,
        createdAt:
          review?.createdAt || membership.createdAt || membership.updatedAt || null,
        updatedAt:
          review?.updatedAt || membership.updatedAt || membership.createdAt || null,
        source: "membership_review_join",
      });
    }

    const normalizedClaims = Array.from(normalizedClaimsByMembershipId.values()).sort(
      (a, b) => {
        const aTime = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
        const bTime = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
        return bTime - aTime;
      },
    );

    return res.status(200).json({
      ok: true,
      memberships: normalizedMemberships,
      claims: normalizedClaims,
      reviews,
      fulfillment,
      onboarding,
      businesses,
    });
  } catch (error) {
    console.error("[admin/founding-memberships]", error);
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}
