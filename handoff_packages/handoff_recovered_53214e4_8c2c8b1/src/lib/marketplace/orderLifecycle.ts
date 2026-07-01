import { computeRevenueSplit } from "../payments/revenue";

export const MARKETPLACE_ORDER_STATES = {
  CHECKOUT_PENDING: "checkout_pending",
  CHECKOUT_FAILED: "checkout_failed",
  CHECKOUT_EXPIRED: "checkout_expired",
  PAID_UNFULFILLED: "paid_unfulfilled",
  FULFILLED_PAYOUT_READY: "fulfilled_payout_ready",
  FULFILLED_PAYOUT_PENDING: "fulfilled_payout_pending",
  REFUNDED: "refunded",
} as const;

export type MarketplaceOrderState =
  (typeof MARKETPLACE_ORDER_STATES)[keyof typeof MARKETPLACE_ORDER_STATES];

export const MARKETPLACE_PAYOUT_STATUSES = {
  NOT_APPLICABLE: "not_applicable",
  PENDING: "pending",
  READY: "ready",
  COMPLETED: "completed",
} as const;

export type MarketplacePayoutStatus =
  (typeof MARKETPLACE_PAYOUT_STATUSES)[keyof typeof MARKETPLACE_PAYOUT_STATUSES];

export function isMarketplaceSellerLiabilityOrder(order: Record<string, any>): boolean {
  const paymentStatus = String(order?.paymentStatus || "").trim().toLowerCase();
  const orderState = String(order?.orderState || "").trim().toLowerCase();
  const paid = order?.paid === true || Boolean(order?.paidAt) || paymentStatus === "paid";
  const refunded = paymentStatus === "refunded" || orderState === MARKETPLACE_ORDER_STATES.REFUNDED;
  return paid && !refunded;
}

export function buildMarketplaceProjectedAmounts(unitAmountCents: number) {
  const split = computeRevenueSplit("marketplace", unitAmountCents);
  return {
    applicationFee: split.bweFee,
    grossAmount: split.grossAmount,
    bweFee: split.bweFee,
    bweFeePercent: split.bweFeePercent,
    sellerPayout: split.sellerPayout,
    netAmount: split.netAmount,
  };
}

export function isMarketplaceOrderStaleCheckout(args: {
  order: Record<string, any> | null | undefined;
  now?: Date;
  expirationThresholdMs: number;
}): boolean {
  const { order, now = new Date(), expirationThresholdMs } = args;
  if (!order || !(expirationThresholdMs > 0)) return false;

  const orderState = String(order.orderState || "").trim().toLowerCase();
  const paymentStatus = String(order.paymentStatus || "").trim().toLowerCase();
  const isPendingCheckout =
    orderState === MARKETPLACE_ORDER_STATES.CHECKOUT_PENDING &&
    paymentStatus !== "paid" &&
    order.paid !== true &&
    !order.paidAt;

  if (!isPendingCheckout) return false;

  const createdAt = order.createdAt ? new Date(order.createdAt) : null;
  if (!createdAt || Number.isNaN(createdAt.getTime())) return false;

  return now.getTime() - createdAt.getTime() > expirationThresholdMs;
}

export type MarketplaceStaleCheckoutDryRunSpec = {
  name: string;
  filterDescription: string;
  outputFields: string[];
  summaryFields: string[];
};

export const MARKETPLACE_STALE_CHECKOUT_DRY_RUN_SPEC: MarketplaceStaleCheckoutDryRunSpec = {
  name: "marketplace-stale-checkout-dry-run",
  filterDescription:
    'marketplace product orders where orderState = "checkout_pending", paid != true, paidAt missing, paymentStatus != "paid", and createdAt older than configured expiration threshold',
  outputFields: [
    "_id",
    "productId",
    "sellerId",
    "stripeSessionId",
    "sessionExpiresAt",
    "createdAt",
    "updatedAt",
    "orderState",
    "paymentStatus",
    "payoutStatus",
    "grossAmount",
    "bweFee",
    "sellerPayout",
  ],
  summaryFields: [
    "recordCount",
    "oldestCreatedAt",
    "newestCreatedAt",
    "withSessionExpiration",
    "withoutSessionExpiration",
    "aggregateProjectedGrossAmount",
    "aggregateProjectedBweFee",
    "aggregateProjectedSellerShare",
  ],
};
