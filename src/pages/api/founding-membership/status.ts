import type { NextApiRequest, NextApiResponse } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { getJwtSecret, getMongoDbName } from "@/lib/env";
import clientPromise from "@/lib/mongodb";
import { resolveVerifiedOwnership } from "@/lib/directoryOwnership";
import {
  buildMongoIdOrStringQuery,
  findFoundingSourcePayment,
  formatUsdFromCents,
  getFoundingClaimStatusLabel,
  getFoundingEngagementReport,
  normalizeFoundingClaimStage,
  normalizeFoundingPaymentStatus,
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

    const membershipBase = {
      productKey: "founding_verified_business_growth_membership",
      membershipStatus: { $in: ["active", "past_due", "cancelled"] },
    };
    const membershipSort = { sort: { updatedAt: -1, createdAt: -1 } } as const;

    // One person can own several businesses (and one email can have several
    // accounts), so the report is for the business being looked at: the
    // ?businessId= one if given (after checking it's theirs), otherwise a
    // business account's own business, otherwise their latest membership.
    const requestedBusinessId = String(req.query.businessId || "").trim();
    let membership: any = null;
    if (requestedBusinessId) {
      const ownsIt =
        (decoded?.accountType === "business" &&
          requestedBusinessId === userId) ||
        Boolean(
          userId &&
          (await resolveVerifiedOwnership(db, {
            entityType: "business",
            entityId: requestedBusinessId,
            userId,
          })),
        );
      if (!ownsIt) {
        return res.status(403).json({ ok: false, error: "forbidden" });
      }
      membership = await db
        .collection("business_memberships")
        .findOne(
          { ...membershipBase, businessId: requestedBusinessId },
          membershipSort,
        );
    } else {
      if (decoded?.accountType === "business" && userId) {
        membership = await db
          .collection("business_memberships")
          .findOne({ ...membershipBase, businessId: userId }, membershipSort);
      }
      if (!membership) {
        membership = await db
          .collection("business_memberships")
          .findOne(
            { ...membershipBase, $or: [{ userId }, { email }] },
            membershipSort,
          );
      }
    }

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

    // An organization (church) membership is the same Founding membership;
    // its listing lives in organizations and its claim in entity_claims.
    let listing: any = business;
    let claimDoc: any = claim;
    if (membership.entityType === "organization" && membership.organizationId) {
      const orgQuery = buildMongoIdOrStringQuery(
        "_id",
        membership.organizationId,
      );
      const org: any = orgQuery
        ? await db.collection("organizations").findOne(orgQuery, {
            projection: { _id: 1, name: 1, city: 1, state: 1, claimStage: 1 },
          })
        : null;
      listing = org
        ? {
            _id: org._id,
            business_name: org.name,
            alias: String(org._id),
            slug: String(org._id),
            city: org.city,
            state: org.state,
            claimStage: org.claimStage,
          }
        : null;
      claimDoc = await db
        .collection("entity_claims")
        .findOne({ membershipId: membership.membershipId });
    }

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

    // Real report, not just a status label -- only meaningful once ownership
    // is actually verified (an unverified listing has no engagement of its
    // own to report on yet).
    const engagementReport =
      listing && !managementAccessLocked
        ? await getFoundingEngagementReport(db, String((listing as any)._id))
        : null;

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
        business: listing
          ? {
              id: String((listing as any)._id),
              name: listing.business_name || null,
              slug: listing.alias || listing.slug || null,
              alias: listing.alias || null,
              city: listing.city || null,
              state: listing.state || null,
            }
          : null,
        claimStatus: normalizeFoundingClaimStage(claimDoc?.claimStatus || null),
        claimStatusLabel: getFoundingClaimStatusLabel(
          claimDoc?.claimStatus ||
            review?.reviewStatus ||
            membership.ownershipReviewStatus,
        ),
        reviewStatus: normalizeFoundingClaimStage(review?.reviewStatus || null),
        publicListingStatus:
          String((listing as any)?.publicListingStatus || "").trim() ||
          (normalizeFoundingClaimStage(
            listing && (listing as any).claimStage
              ? (listing as any).claimStage
              : membership.ownershipReviewStatus,
          ) === "ownership_verified"
            ? "ownership_verified"
            : normalizeFoundingClaimStage(
                  listing && (listing as any).claimStage
                    ? (listing as any).claimStage
                    : membership.ownershipReviewStatus,
                ) === "claim_initiated" ||
                normalizeFoundingClaimStage(
                  listing && (listing as any).claimStage
                    ? (listing as any).claimStage
                    : membership.ownershipReviewStatus,
                ) === "ownership_verification_pending" ||
                normalizeFoundingClaimStage(
                  listing && (listing as any).claimStage
                    ? (listing as any).claimStage
                    : membership.ownershipReviewStatus,
                ) === "additional_evidence_required" ||
                normalizeFoundingClaimStage(
                  listing && (listing as any).claimStage
                    ? (listing as any).claimStage
                    : membership.ownershipReviewStatus,
                ) === "disputed"
              ? "verification_pending"
              : "unclaimed"),
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
        engagementReport,
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
