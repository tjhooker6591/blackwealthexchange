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
      "Activate your verified member identity and start using Black Card tools today.",
    benefits: [
      "Instant digital member card in your dashboard after checkout",
      "Verified BWE member identity used across supported experiences",
      "Member-priced entry to selected events",
      "Member-only seminar and webinar invites",
      "Starter partner savings and ecosystem offers",
    ],
  },
  signature: {
    tier: "signature",
    label: "BWE Black Card Signature",
    checkoutItemId: "black-card-signature",
    priceCents: 14900,
    priceLabel: "$149",
    billingModel: "monthly",
    tagline:
      "Turn monthly activity into measurable savings, priority placement, and faster opportunities.",
    benefits: [
      "Everything in Standard",
      "Higher rewards earn rate from BWE activity",
      "Priority event and seminar entry before Standard",
      "Larger ad credit and marketplace fee credit pools",
      "Partner offers with stronger member pricing",
    ],
  },
  elite: {
    tier: "elite",
    label: "BWE Black Card Elite",
    checkoutItemId: "black-card-elite",
    priceCents: 39900,
    priceLabel: "$399",
    billingModel: "monthly",
    tagline:
      "Operate at executive level with highest rewards velocity, VIP lanes, and direct opportunity leverage.",
    benefits: [
      "Everything in Signature",
      "VIP access to events, summits, and private sessions",
      "Highest rewards multipliers and premium placement credits",
      "Elite partner network and direct opportunity introductions",
      "Priority support lane for high-value member actions",
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
