// src/pages/api/economic-impact/public-summary.ts
//
// Phase 6 -- public-safe subset of the Economic Impact Engine snapshot
// (src/lib/economicImpact/engine.ts). Exposes only non-sensitive,
// mission-aligned figures -- verified economic activity moved to
// Black-owned businesses, businesses supported, active Black Card member
// counts, jobs/applications posted, and referral network size. Deliberately
// omits BWE's own membership/subscription revenue figures, which stay
// admin-only (see /api/admin/economic-impact.ts).

import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { resolveCommunityEconomicActivity } from "@/lib/economicImpact/communityEconomicActivity";
import { resolveBlackCardImpact } from "@/lib/economicImpact/blackCardImpact";
import { resolveJobCareerImpact } from "@/lib/economicImpact/jobCareerImpact";
import { resolveReferralImpact } from "@/lib/economicImpact/referralImpact";
import type { EconomicMetric } from "@/lib/economicImpact/shared";

const PUBLIC_METRIC_KEYS = new Set([
  "community_verified_transaction_count",
  "community_verified_economic_activity_cents",
  "community_distinct_buyers",
  "community_businesses_supported",
  "black_card_active_members",
  "job_postings_total",
  "job_applications_total",
  "referral_signups",
]);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  res.setHeader(
    "Cache-Control",
    "public, max-age=300, stale-while-revalidate=600",
  );

  const client = await clientPromise;
  const db = client.db(getMongoDbName());

  try {
    const [community, blackCard, jobCareer, referral] = await Promise.all([
      resolveCommunityEconomicActivity(db),
      resolveBlackCardImpact(db),
      resolveJobCareerImpact(db),
      resolveReferralImpact(db),
    ]);

    const all: EconomicMetric[] = [
      ...community.metrics,
      ...blackCard.metrics,
      ...jobCareer.metrics,
      ...referral.metrics,
    ];

    const metrics = all.filter((metric) => PUBLIC_METRIC_KEYS.has(metric.key));

    return res
      .status(200)
      .json({ generatedAt: new Date().toISOString(), metrics });
  } catch (error) {
    console.error("[economic-impact/public-summary] failed:", error);
    return res
      .status(500)
      .json({ error: "Failed to resolve public economic impact summary" });
  }
}
