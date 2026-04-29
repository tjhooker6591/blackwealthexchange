export type RevenueType =
  | "marketplace"
  | "ads"
  | "jobs"
  | "courses"
  | "membership"
  | "music"
  | "other";

export type RevenueSplit = {
  grossAmount: number;
  bweFee: number;
  bweFeePercent: number;
  sellerPayout: number;
  netAmount: number;
};

const FEE_PERCENT_BY_TYPE: Record<RevenueType, number> = {
  marketplace: 12,
  ads: 100,
  jobs: 100,
  courses: 100,
  membership: 100,
  music: 100,
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
