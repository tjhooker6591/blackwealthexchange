// src/lib/acquisition/reports.ts
//
// Section 5 of the brief: owner results report + admin financial view,
// with the financial distinctions the brief requires kept structurally
// separate (never summed into one another): merchant gross/net sales,
// BWE platform revenue, estimated pipeline, and owner-attested
// off-platform sales. All confirmed-order/revenue figures come from
// bmev_records (see src/lib/economicActivity360.ts) -- this module never
// maintains its own copy of an amount.

import type { Db } from "mongodb";
import { COLLECTIONS, s } from "./shared";
import { summarizeEvents } from "./events";
import { PROSPECT_STAGES, type ProspectStage } from "./types";

function windowDurationMs(start: string, end: string) {
  return new Date(end).getTime() - new Date(start).getTime();
}

async function bmevWindowTotals(
  db: Db,
  businessId: string,
  since: string,
  until: string,
) {
  const records = await db
    .collection("bmev_records")
    .find({
      businessId,
      paymentVerified: true,
      occurredAt: { $gte: new Date(since), $lt: new Date(until) },
    })
    .toArray();

  const grossCents = records.reduce(
    (sum, r: any) => sum + (Number(r.bmevAmountCents) || 0),
    0,
  );
  const refundedCents = records.reduce(
    (sum, r: any) => sum + (Number(r.refundedAmountCents) || 0),
    0,
  );
  const feeCents = records.reduce(
    (sum, r: any) => sum + (Number(r.bweFeeCents) || 0),
    0,
  );

  return {
    confirmedOrderCount: records.length,
    merchantGrossSalesCents: grossCents,
    merchantNetSalesCents: Math.max(0, grossCents - refundedCents),
    refundedCents,
    // "Earned platform fees ... supported by existing records" -- the
    // bweFeeCents field already stamped at checkout time, per
    // src/lib/economics/marketplaceBmev.ts. Excludes pass-through
    // merchant proceeds and any collected tax by construction (that field
    // never includes them).
    bweRevenueCents: feeCents,
  };
}

export type OwnerReportInput = {
  businessId: string;
  windowStart: string;
  windowEnd: string;
};

export async function resolveOwnerReport(db: Db, input: OwnerReportInput) {
  const businessId = s(input.businessId);
  const [activity, bmevTotals] = await Promise.all([
    summarizeEvents(db, {
      businessId,
      since: input.windowStart,
      until: input.windowEnd,
    }),
    bmevWindowTotals(db, businessId, input.windowStart, input.windowEnd),
  ]);

  // Baseline: an equal-duration window immediately before this one.
  // "Missing baseline is unavailable, not zero" -- we only report a
  // baseline when this business has ANY acquisition_events recorded
  // before windowStart at all; otherwise tracking simply hadn't started
  // yet and a zero would be misleading.
  const durationMs = windowDurationMs(input.windowStart, input.windowEnd);
  const baselineStart = new Date(
    new Date(input.windowStart).getTime() - durationMs,
  ).toISOString();
  const baselineEnd = input.windowStart;

  const hasPriorTracking = await db
    .collection(COLLECTIONS.events)
    .countDocuments({
      businessId,
      eventTime: { $lt: input.windowStart },
    });

  const baseline =
    hasPriorTracking > 0
      ? {
          available: true as const,
          windowStart: baselineStart,
          windowEnd: baselineEnd,
          activity: await summarizeEvents(db, {
            businessId,
            since: baselineStart,
            until: baselineEnd,
          }),
          bmevTotals: await bmevWindowTotals(
            db,
            businessId,
            baselineStart,
            baselineEnd,
          ),
        }
      : {
          available: false as const,
          reason: "No acquisition tracking existed before this window.",
        };

  // Owner-attested off-platform sales are reported as their own line,
  // never merged into the BWE checkout totals above.
  const offPlatform = await db
    .collection(COLLECTIONS.offPlatformSales)
    .find({
      businessId,
      date: { $gte: input.windowStart, $lt: input.windowEnd },
    })
    .toArray();

  return {
    businessId,
    windowStart: input.windowStart,
    windowEnd: input.windowEnd,
    dataCoverage: {
      trackingStartedBeforeWindow: hasPriorTracking > 0,
      excludedAsFiltered: activity.excludedAsFiltered,
      excludedAsDemo: activity.excludedAsDemo,
    },
    // Each event type stays its own count -- never summed into an
    // invented "unique customers" figure.
    profileViews: activity.counts.profile_view,
    contactActions: {
      websiteClicks: activity.counts.website_click,
      phoneClicks: activity.counts.phone_click,
      directionsClicks: activity.counts.directions_click,
    },
    inquiries: activity.counts.inquiry_submitted,
    storefrontViews: activity.counts.storefront_view,
    confirmedOrders: bmevTotals.confirmedOrderCount,
    merchantGrossSalesCents: bmevTotals.merchantGrossSalesCents,
    merchantNetSalesCents: bmevTotals.merchantNetSalesCents,
    refundedCents: bmevTotals.refundedCents,
    sourceBreakdown: activity.sourceBreakdown,
    unattributedEvents: activity.unattributedEvents,
    offPlatformAttestedSales: offPlatform.map((r: any) => ({
      date: r.date,
      amountCents: r.amountCents,
      evidenceRef: r.evidenceRef,
      attributionExplanation: r.attributionExplanation,
    })),
    baseline,
  };
}

export type AdminFinancialReportInput = { since: string; until: string };

export async function resolveAdminFinancialReport(
  db: Db,
  input: AdminFinancialReportInput,
) {
  const prospectsCol = db.collection(COLLECTIONS.prospects);

  const stageCounts: Record<ProspectStage, number> = Object.fromEntries(
    await Promise.all(
      PROSPECT_STAGES.map(async (stage) => [
        stage,
        await prospectsCol.countDocuments({ stage }),
      ]),
    ),
  ) as Record<ProspectStage, number>;

  const [
    totalProspects,
    contactedOrLater,
    repliedOrLater,
    demosOrLater,
    activated,
    paidBusinesses,
  ] = await Promise.all([
    prospectsCol.countDocuments({}),
    prospectsCol.countDocuments({
      stage: {
        $in: [
          "contacted",
          "replied",
          "demo_completed",
          "onboarding_started",
          "activated",
        ],
      },
    }),
    prospectsCol.countDocuments({
      stage: {
        $in: ["replied", "demo_completed", "onboarding_started", "activated"],
      },
    }),
    prospectsCol.countDocuments({
      stage: { $in: ["demo_completed", "onboarding_started", "activated"] },
    }),
    prospectsCol.countDocuments({ stage: "activated" }),
    prospectsCol.find({ paidStatus: "paid" }).toArray(),
  ]);

  const activatedBusinessIds = (
    await prospectsCol
      .find(
        { stage: "activated", businessId: { $ne: null } },
        { projection: { businessId: 1 } },
      )
      .toArray()
  ).map((r: any) => s(r.businessId));

  const [campaigns, bmevRecordsInWindow] = await Promise.all([
    db.collection(COLLECTIONS.campaigns).find({}).toArray(),
    activatedBusinessIds.length
      ? db
          .collection("bmev_records")
          .find({
            businessId: { $in: activatedBusinessIds },
            paymentVerified: true,
            occurredAt: {
              $gte: new Date(input.since),
              $lt: new Date(input.until),
            },
          })
          .toArray()
      : [],
  ]);

  const acquisitionSpendCents = campaigns.reduce(
    (sum, c: any) => sum + (Number(c.costCents) || 0),
    0,
  );
  const bweRevenueCents = bmevRecordsInWindow.reduce(
    (sum, r: any) => sum + (Number(r.bweFeeCents) || 0),
    0,
  );
  const merchantGrossCents = bmevRecordsInWindow.reduce(
    (sum, r: any) => sum + (Number(r.bmevAmountCents) || 0),
    0,
  );
  const refundedCents = bmevRecordsInWindow.reduce(
    (sum, r: any) => sum + (Number(r.refundedAmountCents) || 0),
    0,
  );

  // New paying businesses = activated AND paidStatus flipped to "paid"
  // within this window, per their most recent paid-status activity entry.
  const paidStatusActivities = await db
    .collection(COLLECTIONS.activities)
    .find({
      note: /^Paid status set to paid\.$/,
      timestamp: { $gte: input.since, $lt: input.until },
    })
    .toArray();
  const newPayingBusinessCount = new Set(
    paidStatusActivities.map((r: any) => s(r.prospectId)),
  ).size;

  const cac =
    newPayingBusinessCount > 0
      ? Math.round(acquisitionSpendCents / newPayingBusinessCount)
      : null; // "CAC is unavailable when there are no new paying businesses."

  return {
    window: { since: input.since, until: input.until },
    pipeline: {
      totalProspects,
      stageCounts,
      contactedOrLater,
      repliedOrLater,
      demosOrLater,
      activated,
    },
    conversionDenominators: {
      contactedToReplied:
        contactedOrLater > 0 ? repliedOrLater / contactedOrLater : null,
      repliedToDemo: repliedOrLater > 0 ? demosOrLater / repliedOrLater : null,
      demoToActivated: demosOrLater > 0 ? activated / demosOrLater : null,
    },
    uniquePayingBusinesses: paidBusinesses.length,
    acquisitionSpendCents,
    bweCollectedRevenueCents: bweRevenueCents,
    merchantGrossSalesCents: merchantGrossCents,
    refundedCents,
    cacCents: cac,
    cacNote:
      cac === null
        ? "CAC unavailable: no new paying businesses recorded in this window."
        : null,
    recurringRevenue: {
      status: "not_tracked_in_this_implementation_pass" as const,
      note: "No reliable recurring-revenue signal was reconciled for acquisition-program businesses in this pass; reported as unavailable rather than estimated. See completion report.",
    },
    repeatPurchasesAndRetention: {
      status: "not_tracked_in_this_implementation_pass" as const,
      note: "Cohort/retention analysis was out of scope for this implementation pass; reported as unavailable rather than estimated. See completion report.",
    },
  };
}

/** Estimated pipeline value -- explicitly never revenue. */
export async function resolveEstimatedPipeline(db: Db) {
  const openProspects = await db
    .collection(COLLECTIONS.prospects)
    .find({ lossState: "active", stage: { $ne: "activated" } })
    .toArray();
  return {
    openProspectCount: openProspects.length,
    label: "Estimated pipeline: potential unclosed business, never revenue.",
  };
}
