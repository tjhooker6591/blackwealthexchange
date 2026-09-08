// src/lib/personalization/attribution.ts
//
// P4-09 Attribution.
//
// Ties real economic activity back to the channel/source that produced it.
// Revenue attribution is read directly from the `source`, `businessLine`,
// and `attributionMethod` fields already stamped onto every verified
// bmev_records entry at write time (see src/lib/economics/marketplaceBmev.ts)
// -- we never infer causality that isn't already recorded. Traffic-channel
// mix is reported separately, from flow_events, and explicitly labeled as
// engagement volume rather than conflated with revenue causality, because
// BWE does not currently persist a session-to-purchase join key.

import type { Db } from "mongodb";

export type AttributionBreakdownEntry = {
  key: string;
  transactionCount: number;
  verifiedRevenueCents: number;
};

export type ChannelMixEntry = { key: string; events: number };

export type BusinessAttributionResult = {
  state: "LINKED" | "NOT_LINKED";
  businessId: string;
  revenueBySource: AttributionBreakdownEntry[];
  revenueByBusinessLine: AttributionBreakdownEntry[];
  trafficChannelMix: ChannelMixEntry[];
  provenance: { source: string; authoritative: boolean }[];
};

export type ConsumerAttributionResult = {
  state: "LINKED" | "NOT_LINKED";
  userId: string;
  spendBySource: AttributionBreakdownEntry[];
  spendByBusinessLine: AttributionBreakdownEntry[];
  firstTouchSource: string | null;
  provenance: { source: string; authoritative: boolean }[];
};

function s(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function groupRevenue(records: any[], field: "source" | "businessLine") {
  const grouped = new Map<string, { count: number; cents: number }>();
  for (const record of records) {
    const key = s(record[field]) || "unspecified";
    const entry = grouped.get(key) || { count: 0, cents: 0 };
    entry.count += 1;
    entry.cents += Number(record.bmevAmountCents) || 0;
    grouped.set(key, entry);
  }
  return Array.from(grouped.entries())
    .sort((a, b) => b[1].cents - a[1].cents)
    .map(([key, v]) => ({
      key,
      transactionCount: v.count,
      verifiedRevenueCents: v.cents,
    }));
}

export async function resolveBusinessAttribution(
  db: Db,
  input: { businessId: string },
): Promise<BusinessAttributionResult> {
  const businessId = s(input.businessId);
  if (!businessId) {
    return {
      state: "NOT_LINKED",
      businessId: "",
      revenueBySource: [],
      revenueByBusinessLine: [],
      trafficChannelMix: [],
      provenance: [{ source: "missing_business_id", authoritative: false }],
    };
  }

  const [revenueRecords, flowEvents] = await Promise.all([
    db
      .collection("bmev_records")
      .find(
        { businessId, paymentVerified: true },
        { sort: { occurredAt: -1 }, limit: 500 },
      )
      .toArray(),
    db
      .collection("flow_events")
      .find({ businessId }, { sort: { createdAt: -1 }, limit: 1000 })
      .toArray(),
  ]);

  const channelCounts = new Map<string, number>();
  for (const event of flowEvents) {
    const key =
      s((event as any).source) || s((event as any).section) || "direct";
    channelCounts.set(key, (channelCounts.get(key) || 0) + 1);
  }
  const trafficChannelMix = Array.from(channelCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([key, events]) => ({ key, events }));

  if (!revenueRecords.length && !trafficChannelMix.length) {
    return {
      state: "NOT_LINKED",
      businessId,
      revenueBySource: [],
      revenueByBusinessLine: [],
      trafficChannelMix: [],
      provenance: [
        { source: "no_revenue_or_traffic_activity", authoritative: false },
      ],
    };
  }

  return {
    state: "LINKED",
    businessId,
    revenueBySource: groupRevenue(revenueRecords, "source"),
    revenueByBusinessLine: groupRevenue(revenueRecords, "businessLine"),
    trafficChannelMix,
    provenance: [
      { source: "bmev_records.businessId", authoritative: true },
      { source: "flow_events.businessId", authoritative: false },
    ],
  };
}

export async function resolveConsumerAttribution(
  db: Db,
  input: { userId: string },
): Promise<ConsumerAttributionResult> {
  const userId = s(input.userId);
  if (!userId) {
    return {
      state: "NOT_LINKED",
      userId: "",
      spendBySource: [],
      spendByBusinessLine: [],
      firstTouchSource: null,
      provenance: [{ source: "missing_user_id", authoritative: false }],
    };
  }

  const [revenueRecords, earliestEvent] = await Promise.all([
    db
      .collection("bmev_records")
      .find(
        { buyerUserId: userId, paymentVerified: true },
        { sort: { occurredAt: -1 }, limit: 500 },
      )
      .toArray(),
    db
      .collection("flow_events")
      .find(
        { userId, source: { $ne: null } },
        { sort: { createdAt: 1 }, limit: 1 },
      )
      .toArray(),
  ]);

  if (!revenueRecords.length && !earliestEvent.length) {
    return {
      state: "NOT_LINKED",
      userId,
      spendBySource: [],
      spendByBusinessLine: [],
      firstTouchSource: null,
      provenance: [
        { source: "no_verified_spend_or_activity", authoritative: false },
      ],
    };
  }

  return {
    state: "LINKED",
    userId,
    spendBySource: groupRevenue(revenueRecords, "source"),
    spendByBusinessLine: groupRevenue(revenueRecords, "businessLine"),
    firstTouchSource: earliestEvent.length ? s(earliestEvent[0].source) : null,
    provenance: [{ source: "bmev_records.buyerUserId", authoritative: true }],
  };
}
