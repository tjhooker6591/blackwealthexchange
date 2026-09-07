export type RevenueType =
  | "marketplace"
  | "ads"
  | "jobs"
  | "courses"
  | "membership"
  | "music"
  | "recruiting"
  | "consulting"
  | "other";

export type RevenueSplit = {
  grossAmount: number;
  bweFee: number;
  bweFeePercent: number;
  sellerPayout: number;
  netAmount: number;
};

// Canonical BWE commercial fee rules (single source of truth -- every
// caller of computeRevenueSplit, across checkout creation and webhook
// reconciliation, derives its fee from this table; nothing else in the
// codebase independently hardcodes a percentage). Approved model
// (2026-09-07 correction):
//   Marketplace: 5% BWE platform fee, 95% to the seller.
//   Advertising/sponsorship, memberships/Black Card/premium, and
//   jobs/employer paid products: 100% BWE revenue (direct BWE service
//   sale, no seller/provider split).
// Historical completed transactions are NOT recalculated when this rate
// changes -- their stored bweFee/sellerPayout reflect the rate actually
// applied at the time they were paid. Only new transactions use this
// value going forward.
// Recruiting + Consulting MVP (2026-09-07): recruiting's 15% standard
// placement-fee percentage is NOT this table -- that percentage
// determines the SERVICE PRICE (see src/lib/recruiting/fee.ts), applied
// once, admin-side, to arrive at the agreed invoice amount. Once BWE
// invoices/collects that amount, there is no seller/Connect split on
// it -- 100% of the invoiced amount is BWE revenue, same as
// advertising/membership/jobs. Consulting is priced per engagement
// (no universal percentage anywhere) and is likewise 100% BWE revenue
// once invoiced -- there is no automatic consultant/subcontractor
// payout in this MVP.
const FEE_PERCENT_BY_TYPE: Record<RevenueType, number> = {
  marketplace: 5,
  ads: 100,
  jobs: 100,
  courses: 100,
  membership: 100,
  music: 100,
  recruiting: 100,
  consulting: 100,
  other: 100,
};

export function computeRevenueSplit(
  type: RevenueType,
  grossAmount: number,
): RevenueSplit {
  const gross = Math.max(0, Math.round(Number(grossAmount) || 0));
  const percent = FEE_PERCENT_BY_TYPE[type] ?? 100;

  if (percent >= 100) {
    return {
      grossAmount: gross,
      bweFee: gross,
      bweFeePercent: 100,
      sellerPayout: 0,
      netAmount: gross,
    };
  }

  const fee = Math.round((gross * percent) / 100);
  const payout = Math.max(0, gross - fee);
  return {
    grossAmount: gross,
    bweFee: fee,
    bweFeePercent: percent,
    sellerPayout: payout,
    netAmount: gross,
  };
}

export function checkoutTypeToRevenueType(
  type: string,
  itemId?: string,
): RevenueType {
  if (type === "product") return "marketplace";
  if (type === "ad") return "ads";
  if (type === "job") return "jobs";
  if (type === "course") return "courses";
  if (type === "recruiting") return "recruiting";
  if (type === "consulting") return "consulting";
  if (type === "plan") {
    if ((itemId || "").startsWith("music-creator-")) return "music"; // creator plan only
    if (
      (itemId || "").startsWith("black-card") ||
      itemId === "premium" ||
      itemId === "founder" ||
      (itemId || "").startsWith("wealth-builder-")
    )
      return "membership";
  }
  return "other";
}
