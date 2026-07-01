export type BlackCardTier = "standard" | "signature" | "elite";

export interface BlackCardTierConfig {
  tier: BlackCardTier;
  label: string;
  checkoutItemId: string | null;
  priceCents: number | null;
  priceLabel: string;
  billingModel: "annual" | "invite_only";
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
      "Optional physical card request after membership activation",
    ],
  },
  signature: {
    tier: "signature",
    label: "BWE Black Card Signature",
    checkoutItemId: "founder",
    priceCents: 4900,
    priceLabel: "$49/year",
    billingModel: "annual",
    tagline:
      "Build on Standard with expanding benefits, broader redemption access, and priority access rolling out across experiences.",
    benefits: [
      "Everything in Standard",
      "Expanding premium member experiences as rollout continues",
      "Priority access (rolling out) for selected events and offers",
      "Advanced Black Card features coming to dashboard workflows",
      "Ongoing admin-tracked redemption and membership operations",
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
      "Highest Black Card tier with verified identity, rewards access, and advanced experiences that continue to expand.",
    benefits: [
      "Everything in Signature",
      "Expanded access as Elite experiences roll out",
      "Priority access (rolling out) to selected high-touch member moments",
      "Advanced features coming for Elite membership workflows",
      "Full visibility through Black Card dashboard and admin tracking",
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
