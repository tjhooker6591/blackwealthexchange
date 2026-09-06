// src/lib/ai/grounding.ts
//
// Phase 7 -- BWE AI Mode grounding layer. Resolves a parsed AiIntent
// (src/lib/ai/intent.ts) into real results from BWE's existing canonical
// systems only:
//   - business/product/job/opportunity/universal -> resolveUniversalSearch
//     (src/lib/search/universalSearch.ts) -- the same universal search
//     already used by /search, not a second search engine.
//   - opportunity + urgentDeadline -> the same Student Hub catalog
//     resolver universalSearch itself uses internally
//     (getStudentHubResolvedCatalog / deriveStudentHubLifecycle), sorted
//     by real deadline -- needed because resolveUniversalSearch requires
//     a non-empty query and can't sort by deadline itself.
//   - economic -> the Phase 6 Economic Impact Engine category resolvers
//     directly (no HTTP self-call).
//   - saved -> the real Phase 5 follows/saved-business rows for the
//     authenticated caller only -- never another user's data, and never
//     returned at all when there is no session.
//   - capability -> the static, real PLATFORM_CAPABILITIES index.
//
// Every result returned here traces back to a real document or a real
// static route list. Nothing is invented.

import type { Db } from "mongodb";
import {
  resolveUniversalSearch,
  type UniversalSearchResult,
} from "@/lib/search/universalSearch";
import { getStudentHubResolvedCatalog } from "@/lib/studentHub/repository";
import { deriveStudentHubLifecycle } from "@/lib/studentHub/lifecycle";
import { resolveCommunityEconomicActivity } from "@/lib/economicImpact/communityEconomicActivity";
import { resolveBlackCardImpact } from "@/lib/economicImpact/blackCardImpact";
import { resolveJobCareerImpact } from "@/lib/economicImpact/jobCareerImpact";
import type { EconomicMetric } from "@/lib/economicImpact/shared";
import {
  PLATFORM_CAPABILITIES,
  type PlatformCapability,
} from "@/lib/platformCapabilities";
import { buildIdFilter } from "@/lib/network/shared";
import { mapDirectoryProfileFromDoc } from "@/lib/directoryProfileContract";
import type { AiIntent } from "./intent";

export type AiGroundedResult =
  | { kind: "search"; results: UniversalSearchResult[] }
  | { kind: "economic"; metrics: EconomicMetric[] }
  | { kind: "capability"; capabilities: PlatformCapability[] }
  | {
      kind: "saved";
      businesses: Array<{
        businessId: string;
        displayName: string;
        href: string | null;
      }>;
      requiresAuth: boolean;
    };

function matchesLocation(
  result: UniversalSearchResult,
  location: string | null,
) {
  if (!location) return true;
  const haystack =
    `${result.location || ""} ${result.title} ${result.description}`.toLowerCase();
  return haystack.includes(location.toLowerCase());
}

function matchesPrice(
  result: UniversalSearchResult,
  minPriceCents: number | null,
  maxPriceCents: number | null,
) {
  if (minPriceCents === null && maxPriceCents === null) return true;
  if (typeof result.price !== "number") return false;
  const priceCents = Math.round(result.price * 100);
  if (minPriceCents !== null && priceCents < minPriceCents) return false;
  if (maxPriceCents !== null && priceCents > maxPriceCents) return false;
  return true;
}

async function groundOpportunityUrgent(
  limit: number,
): Promise<UniversalSearchResult[]> {
  const { records } = await getStudentHubResolvedCatalog({ page: "hub" });
  const now = Date.now();

  const withDeadline = records
    .map((record) => ({ record, lifecycle: deriveStudentHubLifecycle(record) }))
    .filter(({ record, lifecycle }) => {
      if (lifecycle.status === "closed") return false;
      if (record.brokenLink) return false;
      if (!record.deadline) return false;
      const deadlineTime = new Date(record.deadline).getTime();
      return Number.isFinite(deadlineTime) && deadlineTime >= now;
    })
    .sort(
      (a, b) =>
        new Date(a.record.deadline as string).getTime() -
        new Date(b.record.deadline as string).getTime(),
    )
    .slice(0, limit);

  return withDeadline.map(({ record }) => ({
    domain: "opportunity" as const,
    type: "opportunity" as const,
    id: record.id,
    title: record.title,
    description:
      record.description?.slice(0, 160) || "No description provided.",
    url:
      record.applicationUrl ||
      record.sourceUrl ||
      "/black-student-opportunities",
    location: record.location || null,
    image: null,
    opportunityType: record.opportunityType || null,
    eligibility: record.eligibilitySummary || null,
    deadline: record.deadline || null,
    trust: { source: record.source || "student_hub" },
    relevanceScore: 0,
    data: record,
  }));
}

export async function resolveAiGrounding(
  db: Db,
  intent: AiIntent,
  session: { userId: string } | null,
): Promise<AiGroundedResult> {
  if (intent.domain === "capability") {
    const q = intent.keyword.toLowerCase();
    const matches = q
      ? PLATFORM_CAPABILITIES.filter((c) =>
          [c.label, c.description, ...c.keywords]
            .join(" ")
            .toLowerCase()
            .includes(q),
        )
      : PLATFORM_CAPABILITIES;
    return {
      kind: "capability",
      capabilities: matches.length ? matches : PLATFORM_CAPABILITIES,
    };
  }

  if (intent.domain === "economic") {
    const [community, blackCard, jobCareer] = await Promise.all([
      resolveCommunityEconomicActivity(db),
      resolveBlackCardImpact(db),
      resolveJobCareerImpact(db),
    ]);
    return {
      kind: "economic",
      metrics: [
        ...community.metrics,
        ...blackCard.metrics,
        ...jobCareer.metrics,
      ],
    };
  }

  if (intent.domain === "saved") {
    if (!session) {
      return { kind: "saved", businesses: [], requiresAuth: true };
    }
    const rows = await db
      .collection("saved_businesses")
      .find({ userId: session.userId })
      .sort({ savedAt: -1 })
      .limit(20)
      .toArray();
    const businessIds = rows
      .map((r: any) => String(r.businessId))
      .filter(Boolean);
    const filter = businessIds.length
      ? {
          $or: businessIds
            .map((id) => buildIdFilter("_id", id))
            .filter(Boolean) as any[],
        }
      : null;
    const docs = filter
      ? await db
          .collection("businesses")
          .find(filter as any)
          .toArray()
      : [];
    const byId = new Map(docs.map((d: any) => [String(d._id), d]));
    const businesses = rows
      .map((row: any) => {
        const doc = byId.get(String(row.businessId));
        if (!doc) return null;
        const profile = mapDirectoryProfileFromDoc(doc);
        return {
          businessId: String(row.businessId),
          displayName: profile.displayName || "Business",
          href:
            doc.alias || doc.slug
              ? `/business/${encodeURIComponent(doc.alias || doc.slug)}`
              : null,
        };
      })
      .filter(
        (
          x,
        ): x is {
          businessId: string;
          displayName: string;
          href: string | null;
        } => Boolean(x),
      );
    return { kind: "saved", businesses, requiresAuth: false };
  }

  // business / product / job / opportunity / universal -> universal search
  const limit = 8;
  if (intent.domain === "opportunity" && intent.urgentDeadline) {
    const results = await groundOpportunityUrgent(limit);
    return { kind: "search", results };
  }

  const searchDomains =
    intent.domain === "universal"
      ? undefined
      : ([intent.domain] as UniversalSearchResult["domain"][]);
  const queryText =
    intent.keyword || intent.location || intent.rawQuery || intent.domain;

  const response = await resolveUniversalSearch(db, {
    query: queryText,
    domains: searchDomains,
    limitPerDomain: limit,
  });

  const filtered = response.results
    .filter((r) => matchesLocation(r, intent.location))
    .filter((r) => matchesPrice(r, intent.minPriceCents, intent.maxPriceCents))
    .slice(0, limit);

  return { kind: "search", results: filtered };
}
