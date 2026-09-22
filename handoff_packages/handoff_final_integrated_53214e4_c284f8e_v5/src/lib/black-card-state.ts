type ResolveBlackCardStateInput = {
  loggedIn: boolean;
  currentPlan: string;
  premiumStatus: string;
  hasPendingRequest: boolean;
  cardStatus: string;
  hasActiveCardSignal: boolean;
};

export function resolveBlackCardState(input: ResolveBlackCardStateInput) {
  if (!input.loggedIn) return "NOT_LOGGED_IN";

  const plan = String(input.currentPlan || "unknown").toLowerCase();
  const premiumStatus = String(input.premiumStatus || "").toLowerCase();
  const cardStatus = String(input.cardStatus || "").toLowerCase();

  if (cardStatus === "revoked") return "REVOKED_CARD";
  if (cardStatus === "suspended") return "SUSPENDED_CARD";

  if (input.hasActiveCardSignal || cardStatus === "active") {
    if (plan === "premium") return "PREMIUM_ACTIVE_CARD";
    if (plan === "founding") return "FOUNDING_ACTIVE_CARD";
    return "ACTIVE_CARD_BUT_PLAN_UNKNOWN";
  }

  if (input.hasPendingRequest) {
    if (plan === "premium") return "PREMIUM_PENDING_REQUEST";
    if (plan === "founding") return "FOUNDING_PENDING_REQUEST";
    if (plan === "free") return "FREE_PENDING_REQUEST";
    return "DUPLICATE_PENDING_REQUEST";
  }

  if (plan === "premium" || premiumStatus === "active")
    return "PREMIUM_NO_REQUEST";
  if (plan === "founding") return "FOUNDING_NO_REQUEST";
  if (plan === "free") return "FREE_NO_REQUEST";

  return "UNKNOWN";
}
