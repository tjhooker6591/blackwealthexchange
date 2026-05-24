export type BlackCardResolvedState =
  | "NOT_LOGGED_IN"
  | "FREE_NO_REQUEST"
  | "FREE_PENDING_REQUEST"
  | "PREMIUM_NO_REQUEST"
  | "PREMIUM_PENDING_REQUEST"
  | "PREMIUM_ACTIVE_CARD"
  | "FOUNDING_NO_REQUEST"
  | "FOUNDING_PENDING_REQUEST"
  | "FOUNDING_ACTIVE_CARD"
  | "ACTIVE_CARD_BUT_PLAN_UNKNOWN"
  | "SUSPENDED_CARD"
  | "REVOKED_CARD"
  | "DUPLICATE_PENDING_REQUEST"
  | "DUPLICATE_ACTIVE_CARD"
  | "TEST_RECORD";

export type Plan = "free" | "premium" | "founding" | "unknown";

export function normalizePlan(currentPlan?: string | null): Plan {
  const p = String(currentPlan || "").toLowerCase();
  if (p === "premium") return "premium";
  if (p === "founding") return "founding";
  if (p === "free" || p === "basic") return "free";
  return "unknown";
}

export function resolveBlackCardState(input: {
  loggedIn: boolean;
  currentPlan?: string | null;
  premiumStatus?: string | null;
  hasPendingRequest?: boolean;
  activeCardCount?: number;
  pendingRequestCount?: number;
  cardStatus?: string | null;
  hasActiveCardSignal?: boolean;
  isTestRecord?: boolean;
}): BlackCardResolvedState {
  if (!input.loggedIn) return "NOT_LOGGED_IN";
  if (input.isTestRecord) return "TEST_RECORD";

  const plan = normalizePlan(input.currentPlan);
  const cardStatus = String(input.cardStatus || "").toLowerCase();
  const activeCard =
    Boolean(input.hasActiveCardSignal) || cardStatus === "active";
  const pending = Boolean(input.hasPendingRequest);

  if ((input.activeCardCount || 0) > 1) return "DUPLICATE_ACTIVE_CARD";
  if ((input.pendingRequestCount || 0) > 1) return "DUPLICATE_PENDING_REQUEST";

  if (activeCard) {
    if (plan === "premium") return "PREMIUM_ACTIVE_CARD";
    if (plan === "founding") return "FOUNDING_ACTIVE_CARD";
    return "ACTIVE_CARD_BUT_PLAN_UNKNOWN";
  }

  if (cardStatus === "suspended") return "SUSPENDED_CARD";
  if (cardStatus === "revoked") return "REVOKED_CARD";

  if (pending) {
    if (plan === "premium") return "PREMIUM_PENDING_REQUEST";
    if (plan === "founding") return "FOUNDING_PENDING_REQUEST";
    return "FREE_PENDING_REQUEST";
  }

  if (
    plan === "premium" &&
    String(input.premiumStatus || "").toLowerCase() === "active"
  )
    return "PREMIUM_NO_REQUEST";
  if (plan === "founding") return "FOUNDING_NO_REQUEST";
  return "FREE_NO_REQUEST";
}
