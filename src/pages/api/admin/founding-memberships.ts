import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import {
  buildFoundingTransitionState,
  buildMongoIdOrStringQuery,
  findFoundingSourcePayment,
  FOUNDING_MEMBERSHIP_PRODUCT_KEY,
  formatUsdFromCents,
  getFoundingClaimVerificationCounts,
  getFoundingClaimVerificationRecords,
  getPendingFoundingClaimVerifications,
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
      const sourcePayment = await findFoundingSourcePayment(db, membership);
      const transition = buildFoundingTransitionState({
        action: action as any,
        previousStatus,
        evidenceStatus: review.evidenceStatus,
        paymentAmountCents:
          sourcePayment?.amountCents ||
          sourcePayment?.grossAmountCents ||
          membership.paymentAmountCents ||
          membership.amountCents ||
          4900,
        paymentCurrency:
          sourcePayment?.currency ||
          membership.paymentCurrency ||
          membership.currency ||
          "usd",
      });
      const resultingStatus = transition.resultingStatus;
      const claimStatus = transition.claimStatus;
      const claimLocked = transition.claimLocked;
      const claimStage = transition.claimStage;
      const evidenceStatus = transition.evidenceStatus;

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
            membershipStatus: "active",
            ownershipReviewStatus: resultingStatus,
            managementAccessStatus: transition.managementAccessStatus,
            paymentStatus: transition.paymentStatus,
            paymentAmountCents: transition.paymentAmountCents,
            paymentDisplayAmount: transition.paymentDisplayAmount.replace(
              " USD",
              "",
            ),
            paymentCurrency: transition.paymentCurrency,
            updatedAt: new Date(),
          },
        },
      );

      await db.collection("membership_fulfillment").updateOne(
        { membershipId },
        {
          $set: {
            ownershipAccessStatus: transition.ownershipAccessStatus,
            fulfillmentStatus: transition.fulfillmentStatus,
            updatedAt: new Date(),
          },
        },
      );

      await db.collection("membership_onboarding").updateOne(
        { membershipId },
        {
          $set: {
            onboardingStatus: transition.onboardingStatus,
            nextStep: transition.nextStep,
            evidencePortalStatus: transition.evidencePortalStatus,
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
            publicListingStatus: transition.publicListingStatus,
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

    const [memberships, _claims, reviews, fulfillment, onboarding, businesses] =
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

    const [normalizedClaims, normalizedRecords, claimVerificationCounts] =
      await Promise.all([
        getPendingFoundingClaimVerifications(db),
        getFoundingClaimVerificationRecords(db),
        getFoundingClaimVerificationCounts(db),
      ]);

    return res.status(200).json({
      ok: true,
      memberships: normalizedMemberships,
      claims: normalizedClaims,
      records: normalizedRecords,
      claimVerificationCounts,
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
