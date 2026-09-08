// src/lib/personalization/businessDiscoveryAnalytics.ts
//
// P4-08 Business Discovery Analytics.
//
// How customers are actually finding a business: real search queries that
// resolved to it (search_quality_events), a weekly trend of real page/CTA
// events (flow_events), and the top event types and traffic sources
// observed. Built entirely from the two behavioral collections already
// written by the app -- no synthetic sampling or estimation.

import type { Db } from "mongodb";

export type DiscoveryWeeklyPoint = { weekStart: string; events: number };
export type DiscoveryTopEntry = { key: string; count: number };

export type BusinessDiscoveryAnalyticsResult = {
  state: "LINKED" | "NOT_LINKED";
  businessId: string;
  totalEvents: number;
  totalSearchAppearances: number;
  weeklyTrend: DiscoveryWeeklyPoint[];
  topEventTypes: DiscoveryTopEntry[];
  topSources: DiscoveryTopEntry[];
  topSearchQueries: DiscoveryTopEntry[];
  provenance: { source: string; authoritative: boolean }[];
};

function s(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function topN(values: string[], n: number): DiscoveryTopEntry[] {
  const counts = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    counts.set(v, (counts.get(v) || 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key, count]) => ({ key, count }));
}

function weekStartOf(date: Date) {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = (day + 6) % 7; // Monday-start weeks
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export async function resolveBusinessDiscoveryAnalytics(
  db: Db,
  input: { businessId: string; weeks?: number },
): Promise<BusinessDiscoveryAnalyticsResult> {
  const businessId = s(input.businessId);
  const weeks = Math.max(4, Math.min(26, Number(input.weeks || 8)));
  const since = new Date(Date.now() - weeks * 7 * 24 * 60 * 60 * 1000);

  if (!businessId) {
    return {
      state: "NOT_LINKED",
      businessId: "",
      totalEvents: 0,
      totalSearchAppearances: 0,
      weeklyTrend: [],
      topEventTypes: [],
      topSources: [],
      topSearchQueries: [],
      provenance: [{ source: "missing_business_id", authoritative: false }],
    };
  }

  const [flowEvents, searchEvents] = await Promise.all([
    db
      .collection("flow_events")
      .find(
        { businessId, createdAt: { $gte: since } },
        { sort: { createdAt: -1 }, limit: 2000 },
      )
      .toArray(),
    db
      .collection("search_quality_events")
      .find(
        { selectedBusinessId: businessId, createdAt: { $gte: since } },
        { sort: { createdAt: -1 }, limit: 500 },
      )
      .toArray(),
  ]);

  if (!flowEvents.length && !searchEvents.length) {
    return {
      state: "NOT_LINKED",
      businessId,
      totalEvents: 0,
      totalSearchAppearances: 0,
      weeklyTrend: [],
      topEventTypes: [],
      topSources: [],
      topSearchQueries: [],
      provenance: [
        { source: "no_discovery_activity_in_window", authoritative: false },
      ],
    };
  }

  const weekBuckets = new Map<string, number>();
  for (const event of flowEvents) {
    const createdAt = (event as any).createdAt;
    if (!(createdAt instanceof Date) && typeof createdAt !== "string") continue;
    const week = weekStartOf(new Date(createdAt));
    weekBuckets.set(week, (weekBuckets.get(week) || 0) + 1);
  }
  const weeklyTrend = Array.from(weekBuckets.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([weekStart, events]) => ({ weekStart, events }));

  return {
    state: "LINKED",
    businessId,
    totalEvents: flowEvents.length,
    totalSearchAppearances: searchEvents.length,
    weeklyTrend,
    topEventTypes: topN(
      flowEvents.map((e: any) => s(e.eventType)),
      8,
    ),
    topSources: topN(
      flowEvents.map((e: any) => s(e.source) || s(e.section)),
      8,
    ),
    topSearchQueries: topN(
      searchEvents.map((e: any) => s(e.query)),
      8,
    ),
    provenance: [
      { source: "flow_events.businessId", authoritative: false },
      {
        source: "search_quality_events.selectedBusinessId",
        authoritative: false,
      },
    ],
  };
}
