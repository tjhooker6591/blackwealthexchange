export const DIRECTORY_ITEM_IDS = [
  "directory-standard",
  "directory-featured",
] as const;

export type AdminDirectoryListingState =
  | "unlinked"
  | "pending_approval"
  | "approved"
  | "active"
  | "expired"
  | "fallback";

export type AdminDirectoryPaymentState = "paid" | "pending" | "refunded";

function normalize(v: unknown): string {
  return String(v || "")
    .trim()
    .toLowerCase();
}

export function normalizeDirectoryStatus(v: unknown): string {
  return normalize(v).replace(/[\s-]+/g, "_");
}

export function isDirectoryItemId(itemId: string | null | undefined) {
  return DIRECTORY_ITEM_IDS.includes(
    itemId as (typeof DIRECTORY_ITEM_IDS)[number],
  );
}

export function getDirectoryPaymentStateFromListing(
  doc: any,
): AdminDirectoryPaymentState {
  const explicit = normalize(doc?.paymentStatus);
  if (explicit === "paid") return "paid";
  if (explicit === "refunded") return "refunded";
  if (explicit === "pending" || explicit === "payment_pending")
    return "pending";

  if (doc?.paid === true) return "paid";
  if (doc?.paidAt) return "paid";

  return "pending";
}

export function getDirectoryListingStateFromListing(
  doc: any,
  now = new Date(),
): AdminDirectoryListingState {
  const explicit = normalizeDirectoryStatus(doc?.listingStatus);
  if (
    explicit === "unlinked" ||
    explicit === "pending_approval" ||
    explicit === "approved" ||
    explicit === "active" ||
    explicit === "expired"
  ) {
    if (explicit === "active") {
      const expires = doc?.expiresAt ? new Date(doc.expiresAt) : null;
      if (expires && !Number.isNaN(expires.getTime()) && expires <= now) {
        return "expired";
      }
    }
    return explicit as AdminDirectoryListingState;
  }

  const status = normalizeDirectoryStatus(doc?.status);
  if (status === "approved") return "approved";
  if (status === "unlinked") return "unlinked";
  if (status === "pending") return "pending_approval";
  if (status === "pending_approval") return "pending_approval";
  if (status === "inactive" || status === "expired") return "expired";
  if (status === "active") {
    const expires = doc?.expiresAt ? new Date(doc.expiresAt) : null;
    if (expires && !Number.isNaN(expires.getTime()) && expires <= now) {
      return "expired";
    }
    return "active";
  }

  if (doc?.needsAttention) return "unlinked";
  return "pending_approval";
}

export function getDirectoryPaymentStateFromPayment(
  doc: any,
): AdminDirectoryPaymentState {
  const st = normalize(doc?.status || doc?.paymentStatus);
  if (st === "paid") return "paid";
  if (st === "refunded") return "refunded";
  return "pending";
}

export function getDirectoryListingStateFromPayment(
  doc: any,
  linked: boolean,
): AdminDirectoryListingState {
  const paymentState = getDirectoryPaymentStateFromPayment(doc);
  const businessId =
    typeof doc?.businessId === "string" && doc.businessId.trim()
      ? doc.businessId.trim()
      : typeof doc?.metadata?.businessId === "string" &&
          doc.metadata.businessId.trim()
        ? doc.metadata.businessId.trim()
        : null;

  if (paymentState !== "paid") return "fallback";
  if (linked) return "active";
  if (!businessId) return "unlinked";
  return "pending_approval";
}

export function summarizeDirectoryRows(
  rows: Array<{
    source?: string | null;
    listingStatus?: string | null;
    paymentStatus?: string | null;
    needsAttention?: boolean | null;
  }>,
) {
  return {
    paid: rows.filter((x) => x.paymentStatus === "paid").length,
    pendingPayment: rows.filter((x) => x.paymentStatus === "pending").length,
    refunded: rows.filter((x) => x.paymentStatus === "refunded").length,
    unlinked: rows.filter((x) => x.listingStatus === "unlinked").length,
    pendingApproval: rows.filter((x) => x.listingStatus === "pending_approval")
      .length,
    approved: rows.filter((x) => x.listingStatus === "approved").length,
    active: rows.filter((x) => x.listingStatus === "active").length,
    expired: rows.filter((x) => x.listingStatus === "expired").length,
    fallback: rows.filter((x) => x.source === "payments_fallback").length,
    needsAttention: rows.filter((x) => !!x.needsAttention).length,
  };
}
