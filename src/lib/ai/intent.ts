// src/lib/ai/intent.ts
//
// Phase 7 -- Natural-Language Economic Discovery. Deterministic intent
// parsing: turns a free-text query into a structured domain + filters
// that route into BWE's existing canonical systems (universal search,
// Student Hub, the Economic Impact Engine, Phase 5 saved/followed lists).
// This layer never calls an external AI provider and never needs one --
// it works identically with or without OPENAI_API_KEY configured, which
// is what lets "translate natural language into the existing canonical
// search/economic systems" work with zero external credentials.

export type AiDomain =
  | "business"
  | "product"
  | "job"
  | "opportunity"
  | "economic"
  | "saved"
  | "capability"
  | "universal";

export type AiIntent = {
  rawQuery: string;
  domain: AiDomain;
  keyword: string;
  location: string | null;
  minPriceCents: number | null;
  maxPriceCents: number | null;
  urgentDeadline: boolean;
};

const DOMAIN_KEYWORDS: Array<{ domain: AiDomain; patterns: RegExp[] }> = [
  {
    domain: "economic",
    patterns: [
      /\beconomic (activity|impact)\b/i,
      /\bhow much (verified )?(economic )?activity\b/i,
      /\brevenue\b/i,
      /\bbmev\b/i,
      /\bmeasured\b.*\bbwe\b/i,
    ],
  },
  {
    domain: "saved",
    patterns: [
      /\bmy saved\b/i,
      /\bmy following\b/i,
      /\bwhat (have|did) i (save|follow)/i,
      /\bfollowing\b/i,
    ],
  },
  {
    domain: "opportunity",
    patterns: [
      /\bscholarship/i,
      /\bgrant/i,
      /\binternship/i,
      /\bstudent opportunit/i,
      /\bfellowship/i,
    ],
  },
  {
    domain: "job",
    patterns: [
      /\bjob/i,
      /\bcareer/i,
      /\bhiring/i,
      /\bemployer/i,
      /\bposition/i,
      /\brole\b/i,
    ],
  },
  {
    domain: "product",
    patterns: [
      /\bproduct/i,
      /\bbuy\b/i,
      /\bshop\b/i,
      /\bmarketplace\b/i,
      /\bunder \$?\d/i,
    ],
  },
  {
    domain: "business",
    patterns: [
      /\bbusiness/i,
      /\brestaurant/i,
      /\bshop\b/i,
      /\bdirectory\b/i,
      /\bnear\b/i,
      /\bstore\b/i,
    ],
  },
  {
    domain: "capability",
    patterns: [
      /\bwhat can i do\b/i,
      /\bhow do i\b/i,
      /\bwhere (can|do) i\b/i,
      /\bwhat is bwe\b/i,
    ],
  },
];

function extractLocation(query: string): {
  cleaned: string;
  location: string | null;
} {
  const match = /\b(?:near|in|around)\s+([a-z][a-z\s,.'-]{1,40})$/i.exec(
    query.trim(),
  );
  if (!match) return { cleaned: query, location: null };
  const location = match[1].trim().replace(/[.,]+$/, "");
  const cleaned = query.slice(0, match.index).trim();
  return { cleaned: cleaned || query, location: location || null };
}

function extractPrice(query: string): {
  cleaned: string;
  minPriceCents: number | null;
  maxPriceCents: number | null;
} {
  const under = /\bunder\s+\$?(\d+(?:\.\d{1,2})?)/i.exec(query);
  if (under) {
    const cents = Math.round(parseFloat(under[1]) * 100);
    return {
      cleaned: query.replace(under[0], "").trim(),
      minPriceCents: null,
      maxPriceCents: Number.isFinite(cents) ? cents : null,
    };
  }
  const over = /\bover\s+\$?(\d+(?:\.\d{1,2})?)/i.exec(query);
  if (over) {
    const cents = Math.round(parseFloat(over[1]) * 100);
    return {
      cleaned: query.replace(over[0], "").trim(),
      minPriceCents: Number.isFinite(cents) ? cents : null,
      maxPriceCents: null,
    };
  }
  const between =
    /\bbetween\s+\$?(\d+(?:\.\d{1,2})?)\s+and\s+\$?(\d+(?:\.\d{1,2})?)/i.exec(
      query,
    );
  if (between) {
    const minCents = Math.round(parseFloat(between[1]) * 100);
    const maxCents = Math.round(parseFloat(between[2]) * 100);
    return {
      cleaned: query.replace(between[0], "").trim(),
      minPriceCents: Number.isFinite(minCents) ? minCents : null,
      maxPriceCents: Number.isFinite(maxCents) ? maxCents : null,
    };
  }
  return { cleaned: query, minPriceCents: null, maxPriceCents: null };
}

function extractUrgency(query: string): {
  cleaned: string;
  urgentDeadline: boolean;
} {
  const match =
    /\b(closing soon|deadline soon|due soon|ending soon|urgent)\b/i.exec(query);
  if (!match) return { cleaned: query, urgentDeadline: false };
  return { cleaned: query.replace(match[0], "").trim(), urgentDeadline: true };
}

function detectDomain(query: string): AiDomain {
  for (const entry of DOMAIN_KEYWORDS) {
    if (entry.patterns.some((pattern) => pattern.test(query)))
      return entry.domain;
  }
  return "universal";
}

export function parseAiIntent(rawQuery: string): AiIntent {
  const trimmed = (rawQuery || "").trim().slice(0, 300);
  let working = trimmed;

  const { cleaned: afterLocation, location } = extractLocation(working);
  working = afterLocation;

  const {
    cleaned: afterPrice,
    minPriceCents,
    maxPriceCents,
  } = extractPrice(working);
  working = afterPrice;

  const { cleaned: afterUrgency, urgentDeadline } = extractUrgency(working);
  working = afterUrgency;

  const domain = detectDomain(trimmed);

  // Strip a few filler lead words so the remaining text is a clean search
  // keyword ("Find Black-owned restaurants" -> "Black-owned restaurants").
  let keyword = working
    .replace(/^(find|show( me)?|what|search for|i want|i need|list)\b\s*/i, "")
    .replace(/\?$/, "")
    .trim();

  // resolveUniversalSearch (src/lib/search/universalSearch.ts) matches the
  // *entire* keyword as one literal substring, so words that never appear
  // verbatim in a BWE record only break the match. "Black-owned"/"BWE" are
  // true of every listing by definition and carry no discriminating text,
  // so they're always stripped. Domain-name filler ("jobs", "business",
  // "products"...) is only stripped when real content words remain --
  // "What jobs match technology leadership?" -> "technology leadership".
  keyword = keyword
    .replace(/\bblack[- ]owned\b/gi, "")
    .replace(/\bbwe\b/gi, "")
    .trim();

  const domainFillerByDomain: Partial<Record<AiDomain, RegExp>> = {
    job: /\b(jobs?|careers?|hiring|positions?|roles?|match(es)?)\b/gi,
    business: /\b(businesses?|shops?|stores?|directory)\b/gi,
    product: /\b(products?|shop(ping)?|marketplace)\b/gi,
    opportunity:
      /\b(scholarships?|grants?|internships?|opportunit(y|ies)|fellowships?)\b/gi,
  };
  const fillerPattern = domainFillerByDomain[domain];
  if (fillerPattern) {
    const withoutFiller = keyword
      .replace(fillerPattern, "")
      .replace(/\s+/g, " ")
      .trim();
    if (withoutFiller) keyword = withoutFiller;
  }
  keyword = keyword.replace(/\s+/g, " ").trim();

  return {
    rawQuery: trimmed,
    domain,
    keyword,
    location,
    minPriceCents,
    maxPriceCents,
    urgentDeadline,
  };
}
