import type { NextApiRequest, NextApiResponse } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { getJwtSecret, getMongoDbName } from "@/lib/env";
import clientPromise from "@/lib/mongodb";
import {
  getFoundingClaimStatusLabel,
  normalizeFoundingClaimStage,
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

    const [
      business,
      claim,
      review,
      onboarding,
      fulfillment,
      baseline,
      billing,
    ] = await Promise.all([
      membership.businessId
        ? db
            .collection("businesses")
            .findOne(
              { _id: membership.businessId as any },
              {
                projection: {
                  business_name: 1,
                  alias: 1,
                  slug: 1,
                  city: 1,
                  state: 1,
                },
              },
            )
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

    return res.status(200).json({
      ok: true,
      membership: {
        membershipId: membership.membershipId,
        membershipName: membership.membershipName,
        membershipStatus: membership.membershipStatus,
        ownershipReviewStatus:
          membership.ownershipReviewStatus || review?.reviewStatus || null,
        business: business
          ? {
              name: business.business_name || null,
              slug: business.alias || business.slug || null,
              city: business.city || null,
              state: business.state || null,
            }
          : null,
        claimStatus: normalizeFoundingClaimStage(claim?.claimStatus || null),
        claimStatusLabel: getFoundingClaimStatusLabel(
          claim?.claimStatus ||
            review?.reviewStatus ||
            membership.ownershipReviewStatus,
        ),
        reviewStatus: normalizeFoundingClaimStage(review?.reviewStatus || null),
        publicListingStatus:
          normalizeFoundingClaimStage(
            business && (business as any).claimStage
              ? (business as any).claimStage
              : membership.ownershipReviewStatus,
          ) === "ownership_verified"
            ? "ownership_verified"
            : normalizeFoundingClaimStage(
                  business && (business as any).claimStage
                    ? (business as any).claimStage
                    : membership.ownershipReviewStatus,
                ) === "claim_initiated" ||
                normalizeFoundingClaimStage(
                  business && (business as any).claimStage
                    ? (business as any).claimStage
                    : membership.ownershipReviewStatus,
                ) === "ownership_verification_pending" ||
                normalizeFoundingClaimStage(
                  business && (business as any).claimStage
                    ? (business as any).claimStage
                    : membership.ownershipReviewStatus,
                ) === "additional_evidence_required" ||
                normalizeFoundingClaimStage(
                  business && (business as any).claimStage
                    ? (business as any).claimStage
                    : membership.ownershipReviewStatus,
                ) === "disputed"
              ? "verification_pending"
              : "unclaimed",
        evidenceStatus: review?.evidenceStatus || null,
        evidencePortalStatus: onboarding?.evidencePortalStatus || null,
        onboardingStatus: onboarding?.onboardingStatus || null,
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
