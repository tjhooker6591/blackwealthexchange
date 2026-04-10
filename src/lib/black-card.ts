export type BlackCardTier = "standard" | "signature" | "elite";

export interface BlackCardTierConfig {
  tier: BlackCardTier;
  label: string;
  checkoutItemId: string;
  priceCents: number;
  monthlyLabel: string;
  tagline: string;
  benefits: string[];
}

export const BLACK_CARD_POSITIONING = "Built for Black Economic Power";

export const BLACK_CARD_TIERS: Record<BlackCardTier, BlackCardTierConfig> = {
  standard: {
    tier: "standard",
    label: "BWE Black Card Standard",
    checkoutItemId: "black-card-standard",
    priceCents: 2310,
    monthlyLabel: "$23.10",
    tagline: "Accessible ecosystem membership identity + starter benefits.",
    benefits: [
      "Digital Black Card member identity",
      "Starter rewards on approved ecosystem activity",
      "Member-only discounts and partner offers",
      "Events/webinar access (standard lane)",
      "Course unlock credits and marketplace fee credits",
    ],
  },
  signature: {
    tier: "signature",
    label: "BWE Black Card Signature",
    checkoutItemId: "black-card-signature",
    priceCents: 79900,
    monthlyLabel: "$799",
    tagline: "Upgraded access, stronger rewards, and premium member value.",
    benefits: [
      "Everything in Standard",
      "Higher rewards earn rate for BWE activity",
      "Priority access to selected events and seminars",
      "Larger ad + marketplace fee credit pools",
      "Priority partner offers and premium placement opportunities",
    ],
  },
  elite: {
    tier: "elite",
    label: "BWE Black Card Elite",
    checkoutItemId: "black-card-elite",
    priceCents: 199900,
    monthlyLabel: "$1,999",
    tagline:
      "Top-tier status with VIP ecosystem access and business advantages.",
    benefits: [
      "Everything in Signature",
      "VIP event, summit, and private session access",
      "Highest rewards multipliers + premium placement credits",
      "Elite partner network and opportunity introductions",
      "Dedicated member support path for premium experiences",
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
