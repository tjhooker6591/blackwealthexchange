import type { NextApiRequest, NextApiResponse } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { getJwtSecret, getMongoDbName } from "@/lib/env";
import clientPromise from "@/lib/mongodb";
import {
  buildMongoIdOrStringQuery,
  findFoundingSourcePayment,
  formatUsdFromCents,
  getFoundingClaimStatusLabel,
  normalizeFoundingClaimStage,
  normalizeFoundingPaymentStatus,
  resolveFoundingOwnershipState,
} from "@/lib/founding-membership";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const token = cookies.session_token;
    if (!token) {
      return res.status(401).json({ ok: false, error: "unauthorized" });
    }

    const decoded = jwt.verify(token, getJwtSecret()) as any;
    const userId = String(decoded?.userId || "").trim();
    const email = String(decoded?.email || "")
      .trim()
      .toLowerCase();
    if (!userId && !email) {
      return res.status(401).json({ ok: false, error: "unauthorized" });
    }

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

    if (!membership) {
      return res.status(200).json({ ok: true, membership: null });
    }

    const membershipBusinessQuery = buildMongoIdOrStringQuery(
      "_id",
      membership.businessId,
    );

    const [
      business,
      claim,
      review,
      onboarding,
      fulfillment,
      baseline,
      billing,
    ] = await Promise.all([
      membershipBusinessQuery
        ? db.collection("businesses").findOne(membershipBusinessQuery, {
            projection: {
              _id: 1,
              business_name: 1,
              alias: 1,
              slug: 1,
              city: 1,
              state: 1,
              claimStage: 1,
              claimLocked: 1,
            },
          })
        : null,
      db
        .collection("business_claims")
        .findOne({ membershipId: membership.membershipId }),
      db
        .collection("ownership_reviews")
        .findOne({ sourceMembershipId: membership.membershipId }),
      db
        .collection("membership_onboarding")
        .findOne({ membershipId: membership.membershipId }),
      db
        .collection("membership_fulfillment")
        .findOne({ membershipId: membership.membershipId }),
      db
        .collection("profile_performance_baselines")
        .findOne({ membershipId: membership.membershipId }),
      db.collection("users").findOne(
        { $or: [{ _id: membership.userId as any }, { email }] },
        {
          projection: {
            stripeSubscriptionId: 1,
            nextBillingDate: 1,
            subscriptionCancelAtPeriodEnd: 1,
            subscriptionStatus: 1,
            renewalStatus: 1,
          },
        },
      ),
    ]);

    const sourcePayment = await findFoundingSourcePayment(db, membership);
    const normalizedPaymentStatus = normalizeFoundingPaymentStatus(
      sourcePayment || membership,
    );
    const paymentAmount = formatUsdFromCents(
      sourcePayment?.amountCents ||
        sourcePayment?.grossAmountCents ||
        membership.paymentAmountCents ||
        membership.amountCents ||
        4900,
    );
    const ownershipState = resolveFoundingOwnershipState({
      business,
      claim,
      review,
      membership,
      publicListingStatus: (business as any)?.publicListingStatus,
      claimStage: (business as any)?.claimStage,
      claimStatus: claim?.claimStatus,
      ownershipReviewStatus:
        review?.reviewStatus || membership.ownershipReviewStatus,
    });
    const nextStep =
      onboarding?.nextStep ||
      (review?.evidenceStatus === "awaiting_additional_evidence"
        ? "submit additional ownership evidence"
        : normalizeFoundingClaimStage(
              review?.reviewStatus || membership.ownershipReviewStatus,
            ) === "ownership_verified"
          ? "ownership verified"
          : "submit ownership evidence for ownership verification");
    const managementAccessLocked =
      String(
        fulfillment?.ownershipAccessStatus ||
          membership.managementAccessStatus ||
          "",
      )
        .trim()
        .toLowerCase() !== "approved";

    return res.status(200).json({
      ok: true,
      membership: {
        membershipId: membership.membershipId,
        membershipName: membership.membershipName,
        membershipStatus: membership.membershipStatus,
        ownershipReviewStatus:
          membership.ownershipReviewStatus || review?.reviewStatus || null,
        paymentStatus: normalizedPaymentStatus,
        paymentAmount,
        amountCents: Number(
          sourcePayment?.amountCents ||
            sourcePayment?.grossAmountCents ||
            membership.paymentAmountCents ||
            membership.amountCents ||
            4900,
        ),
        currency: String(
          sourcePayment?.currency ||
            membership.paymentCurrency ||
            membership.currency ||
            "usd",
        ).toLowerCase(),
        business: business
          ? {
              id: String((business as any)._id),
              name: business.business_name || null,
              slug: business.alias || business.slug || null,
              alias: business.alias || null,
              city: business.city || null,
              state: business.state || null,
            }
          : null,
        claimStatus:
          ownershipState.canonicalState === "ownership_verified"
            ? "ownership_verified"
            : normalizeFoundingClaimStage(claim?.claimStatus || null),
        claimStatusLabel: getFoundingClaimStatusLabel(
          ownershipState.canonicalState ||
            claim?.claimStatus ||
            review?.reviewStatus ||
            membership.ownershipReviewStatus,
        ),
        reviewStatus:
          ownershipState.canonicalState === "ownership_verified"
            ? "ownership_verified"
            : normalizeFoundingClaimStage(review?.reviewStatus || null),
        publicListingStatus: ownershipState.publicListingStatus,
        evidenceStatus: review?.evidenceStatus || null,
        evidencePortalStatus: onboarding?.evidencePortalStatus || null,
        onboardingStatus: onboarding?.onboardingStatus || null,
        nextStep,
        managementAccessLocked,
        managementAccessStatus:
          fulfillment?.ownershipAccessStatus ||
          membership.managementAccessStatus ||
          null,
        fulfillmentStatus: fulfillment?.fulfillmentStatus || null,
        profileReviewStatus: fulfillment?.profileReviewStatus || null,
        baselineStatus:
          baseline?.baselineStatus || fulfillment?.baselineStatus || null,
        monthlyReportingStatus: fulfillment?.monthlyReportingStatus || null,
        supportStatus: fulfillment?.supportStatus || null,
        checklist: Array.isArray(fulfillment?.checklist)
          ? fulfillment.checklist
          : [],
        billing: {
          hasManageableSubscription: Boolean(billing?.stripeSubscriptionId),
          nextBillingDate: billing?.nextBillingDate || null,
          cancelAtPeriodEnd: Boolean(billing?.subscriptionCancelAtPeriodEnd),
          subscriptionStatus: billing?.subscriptionStatus || null,
          renewalStatus: billing?.renewalStatus || null,
        },
      },
    });
  } catch (error) {
    console.error("[founding-membership/status]", error);
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}
