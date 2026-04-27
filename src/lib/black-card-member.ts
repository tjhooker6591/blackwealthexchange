import cookie from "cookie";
import jwt from "jsonwebtoken";
import type { NextApiRequest } from "next";
import { getJwtSecret } from "@/lib/env";

export type BlackCardSession = {
  userId: string;
  email: string;
};

export function getBlackCardSession(
  req: NextApiRequest,
): BlackCardSession | null {
  try {
    const parsed = cookie.parse(req.headers.cookie || "");
    const token = parsed.session_token || req.cookies?.session_token;
    if (!token) return null;

    const secret = getJwtSecret();
    if (!secret) return null;

    const payload = jwt.verify(token, secret) as {
      userId?: string;
      email?: string;
    };
    if (!payload?.userId || !payload?.email) return null;

    return { userId: payload.userId, email: payload.email };
  } catch {
    return null;
  }
}

export const BLACK_CARD_EARN_RULES: Record<string, number> = {
  marketplace_purchase: 20,
  event_join: 12,
  seminar_attend: 15,
  webinar_attend: 10,
  referral_user: 25,
  referral_business: 40,
  learning_completion: 18,
  membership_renewal: 30,
};

export const BLACK_CARD_REDEMPTION_COSTS: Record<string, number> = {
  ad_credit: 120,
  marketplace_fee_credit: 80,
  course_unlock: 150,
  event_access: 180,
  partner_offer: 100,
};

export const BLACK_CARD_REDEMPTION_MIN_TIER: Record<string, BlackCardTier> = {
  ad_credit: "signature",
  marketplace_fee_credit: "standard",
  course_unlock: "signature",
  event_access: "standard",
  partner_offer: "elite",
};

export const BLACK_CARD_TIER_ORDER = {
  standard: 1,
  signature: 2,
  elite: 3,
} as const;

export type BlackCardTier = keyof typeof BLACK_CARD_TIER_ORDER;

export function isTierAllowed(
  currentTier: string | null | undefined,
  minimumTier: BlackCardTier,
) {
  if (!currentTier) return false;
  const normalized = currentTier.toLowerCase() as BlackCardTier;
  if (!(normalized in BLACK_CARD_TIER_ORDER)) return false;
  return (
    BLACK_CARD_TIER_ORDER[normalized] >= BLACK_CARD_TIER_ORDER[minimumTier]
  );
}
