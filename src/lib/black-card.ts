export type BlackCardTier = "standard" | "signature" | "elite";

export interface BlackCardTierConfig {
  tier: BlackCardTier;
  label: string;
  checkoutItemId: string | null;
  priceCents: number | null;
  priceLabel: string;
  billingModel: "annual" | "monthly" | "invite_only";
  tagline: string;
  benefits: string[];
}

export const BLACK_CARD_POSITIONING = "Built for Black Economic Power";

export const BLACK_CARD_TIERS: Record<BlackCardTier, BlackCardTierConfig> = {
  standard: {
    tier: "standard",
    label: "BWE Black Card Standard",
    checkoutItemId: "premium",
    priceCents: 1200,
    priceLabel: "$12/year",
    billingModel: "annual",
    tagline:
      "Activate verified BWE membership identity and start using Black Card rewards tools today.",
    benefits: [
      "Instant digital member card in your dashboard after checkout",
      "Verified BWE member identity used across supported experiences",
      "Access to the existing BWE rewards and redemption system",
      "QR-verifiable membership card for live status checks",
      "Current Black Card tools available through the active digital member experience",
    ],
  },
  signature: {
    tier: "signature",
    label: "BWE Black Card Signature",
    checkoutItemId: "founder",
    priceCents: 4900,
    priceLabel: "$49/month",
    billingModel: "monthly",
    tagline:
      "Build on Standard with higher-tier rewards access and added member benefits available in the current system.",
    benefits: [
      "Everything in Standard",
      "Higher-tier rewards access in supported experiences",
      "Priority access for selected events and offers when available",
      "Current Signature Black Card features in dashboard workflows",
      "Ongoing redemption and membership support",
    ],
  },
  elite: {
    tier: "elite",
    label: "BWE Black Card Elite",
    checkoutItemId: null,
    priceCents: null,
    priceLabel: "Invite-only",
    billingModel: "invite_only",
    tagline:
      "Highest Black Card tier with verified identity, rewards access, and high-touch member support.",
    benefits: [
      "Everything in Signature",
      "High-touch access for selected member opportunities",
      "Priority access for eligible Elite moments and offers",
      "Elite-specific support across active Black Card experiences",
      "Full visibility through the Black Card dashboard",
    ],
  },
};

export const BLACK_CARD_TIER_BY_ITEM_ID: Record<string, BlackCardTier> = {
  premium: "standard",
  founder: "signature",
};

export function isBlackCardPlanItemId(itemId: string) {
  return itemId in BLACK_CARD_TIER_BY_ITEM_ID;
}
