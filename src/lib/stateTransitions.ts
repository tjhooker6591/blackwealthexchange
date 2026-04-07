export type TransitionResult = {
  ok: boolean;
  reason?: string;
};

export function canApproveDirectoryListing(args: {
  paymentStatus?: string | null;
  forceApproveUnpaid?: boolean;
}): TransitionResult {
  const status = String(args.paymentStatus || "")
    .trim()
    .toLowerCase();
  if (status === "paid") return { ok: true };
  if (args.forceApproveUnpaid)
    return { ok: true, reason: "forced_unpaid_override" };
  return {
    ok: false,
    reason: `payment_not_paid:${status || "unknown"}`,
  };
}

export function canCompleteAffiliatePayout(args: {
  payoutStatus?: string | null;
}): TransitionResult {
  const status = String(args.payoutStatus || "")
    .trim()
    .toLowerCase();
  if (!status) return { ok: false, reason: "missing_payout_status" };
  if (status === "completed") {
    return { ok: false, reason: "already_completed" };
  }
  if (status !== "pending") {
    return { ok: false, reason: `invalid_payout_status:${status}` };
  }
  return { ok: true };
}
