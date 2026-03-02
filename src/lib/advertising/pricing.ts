// src/lib/advertising/pricing.ts

export type AdOptionId =
  | "featured-sponsor"
  | "directory-standard"
  | "directory-featured"
  | "banner-ad"
  | "top-sponsor"
  | "sponsored-listing";

type PriceMap = Record<number, number>; // durationDays -> dollars

type AdPricingConfig = {
  label: string;
  defaultDurationDays: number;
  prices: PriceMap;
};

export type AdQuote = {
  option: AdOptionId;
  label: string;
  durationDays: number;
  amountDollars: number;
  amountCents: number;
};

export const AD_PRICING: Record<AdOptionId, AdPricingConfig> = {
  // Matches your Featured Sponsor UI (1 week $25, 2 weeks $45, 1 month $80)
  "featured-sponsor": {
    label: "Featured Sponsor",
    defaultDurationDays: 14,
    prices: {
      7: 25,
      14: 45,
      30: 80,
    },
  },

  // Keep these aligned with your actual sales pages
  "directory-standard": {
    label: "Directory Listing (Standard)",
    defaultDurationDays: 30,
    prices: {
      30: 49,
    },
  },

  "directory-featured": {
    label: "Directory Listing (Featured)",
    defaultDurationDays: 30,
    prices: {
      30: 99,
    },
  },

  "banner-ad": {
    label: "Banner Ad",
    defaultDurationDays: 14,
    prices: {
      14: 199,
      30: 349,
    },
  },

  "top-sponsor": {
    label: "Top Sponsor",
    defaultDurationDays: 30,
    prices: {
      30: 299,
    },
  },

  "sponsored-listing": {
    label: "Sponsored Listing",
    defaultDurationDays: 30,
    prices: {
      30: 79,
    },
  },
};

function isAdOptionId(value: string): value is AdOptionId {
  return value in AD_PRICING;
}

function toPositiveInt(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.round(n);
}

/**
 * Shared pricing authority for ad UI + checkout API.
 * Accepts optional durationDays and applies option-specific default.
 */
export function getAdQuote(params: {
  option: string;
  durationDays?: number | string; // <-- optional fixes TS error
}): AdQuote | null {
  const rawOption = String(params.option || "").trim();
  if (!isAdOptionId(rawOption)) return null;

  const config = AD_PRICING[rawOption];
  const requestedDays = toPositiveInt(params.durationDays);
  const durationDays = requestedDays ?? config.defaultDurationDays;

  const amountDollars = config.prices[durationDays];
  if (typeof amountDollars !== "number" || amountDollars <= 0) {
    return null;
  }

  return {
    option: rawOption,
    label: config.label,
    durationDays,
    amountDollars,
    amountCents: Math.round(amountDollars * 100),
  };
}

/**
 * Convenience helper for APIs that only need cents.
 * Throws on invalid option/duration so your handler can return 400.
 */
export function getAdPriceCents(params: {
  option: string;
  durationDays?: number | string;
}): number {
  const quote = getAdQuote(params);
  if (!quote) {
    throw new Error(
      `Invalid ad pricing request: option=${String(params.option)} durationDays=${String(params.durationDays ?? "")}`,
    );
  }
  return quote.amountCents;
}

/**
 * Convenience helper for display names in server-side checkout/webhook code.
 */
export function getAdItemName(option: string): string {
  const quote = getAdQuote({ option });
  return quote?.label || `Advertising Purchase (${option})`;
}

/**
 * Useful for UI buttons/selectors (e.g., show valid durations for an option).
 */
export function getAdDurationOptions(option: string): Array<{
  durationDays: number;
  amountDollars: number;
}> {
  const rawOption = String(option || "").trim();
  if (!isAdOptionId(rawOption)) return [];

  const config = AD_PRICING[rawOption];

  return Object.entries(config.prices)
    .map(([days, amount]) => ({
      durationDays: Number(days),
      amountDollars: amount,
    }))
    .sort((a, b) => a.durationDays - b.durationDays);
}

/**
 * Optional helper if you need to validate an incoming option string elsewhere.
 */
export function isKnownAdOption(option: string): option is AdOptionId {
  return isAdOptionId(String(option || "").trim());
}
