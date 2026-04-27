export type BlackCardTier = "standard" | "signature" | "elite";

export interface BlackCardTierConfig {
  tier: BlackCardTier;
  label: string;
  checkoutItemId: string;
  priceCents: number;
  priceLabel: string;
  billingModel: "entry_fee" | "monthly";
  tagline: string;
  benefits: string[];
}

export const BLACK_CARD_POSITIONING = "Built for Black Economic Power";

export const BLACK_CARD_TIERS: Record<BlackCardTier, BlackCardTierConfig> = {
  standard: {
    tier: "standard",
    label: "BWE Black Card Standard",
    checkoutItemId: "black-card-standard",
    priceCents: 3800,
    priceLabel: "$38.00",
    billingModel: "entry_fee",
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
    checkoutItemId: "black-card-signature",
    priceCents: 14900,
    priceLabel: "$149.00",
    billingModel: "monthly",
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
    checkoutItemId: "black-card-elite",
    priceCents: 39900,
    priceLabel: "$399.00",
    billingModel: "monthly",
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
  "black-card-standard": "standard",
  "black-card-signature": "signature",
  "black-card-elite": "elite",
};

export function isBlackCardPlanItemId(itemId: string) {
  return itemId in BLACK_CARD_TIER_BY_ITEM_ID;
}
