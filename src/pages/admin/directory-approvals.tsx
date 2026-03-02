// src/pages/admin/directory-approvals.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type ListingRow = {
  _id?: any;
  source?: string;

  // common fields
  businessName?: string | null;
  businessId?: string | null;
  businessIdReal?: string | null;
  userId?: string | null;
  email?: string | null;

  // directory_listings shape
  status?: string | null;
  listingStatus?: string | null;
  paymentStatus?: string | null;
  paid?: boolean;
  tier?: "standard" | "featured" | string | null;
  featuredSlot?: number | null;
  queuePosition?: number | null;
  featuredEndDate?: string | Date | null;
  expiresAt?: string | Date | null;
  createdAt?: string | Date | null;
  paidAt?: string | Date | null;
  needsAttention?: boolean;
  stripeSessionId?: string | null;
  paymentIntentId?: string | null;

  // payments fallback shape
  linkedListingExists?: boolean;
  fulfillmentStatus?: string | null;
  itemId?: string | null;
  amountCents?: number | null;
};

type ApiResponseShape = {
  ok?: boolean;
  error?: string;
  message?: string;
  source?: string;
  total?: number;
  page?: number;
  limit?: number;
  listings?: unknown;
  summary?: Record<string, any>;
};

type PaymentFilter = "all" | "paid" | "pending" | "refunded";
type ListingFilter =
  | "all"
  | "unlinked"
  | "pending_approval"
  | "approved"
  | "active"
  | "expired"
  | "fallback";

function toArrayPayload(data: unknown): ListingRow[] {
  if (Array.isArray(data)) return data as ListingRow[];
  if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as any).listings)
  ) {
    return (data as any).listings as ListingRow[];
  }
  return [];
}

function asId(value: any): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    if (typeof value.$oid === "string") return value.$oid;
    if (typeof value.toString === "function") return value.toString();
  }
  return String(value);
}

function fmtDate(v: unknown): string {
  if (!v) return "-";
  const d = new Date(v as any);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
}

function fmtDateTime(v: unknown): string {
  if (!v) return "-";
  const d = new Date(v as any);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

function fmtMoney(cents?: number | null): string {
  if (typeof cents !== "number" || !Number.isFinite(cents)) return "-";
  return `$${(cents / 100).toFixed(2)}`;
}

function normalize(v: unknown) {
  return String(v || "")
    .trim()
    .toLowerCase();
}

function isFallbackRow(row: ListingRow) {
  return (
    row.source === "payments_fallback" ||
    !!row.paymentStatus ||
    !!row.fulfillmentStatus
  );
}

function displayName(row: ListingRow): string {
  return (
    row.businessName ||
    row.email ||
    row.businessIdReal ||
    row.businessId ||
    row.userId ||
    "—"
  );
}

function tierText(row: ListingRow): string {
  if (row.tier) return String(row.tier);
  if (row.itemId === "directory-featured") return "featured";
  if (row.itemId === "directory-standard") return "standard";
  return "—";
}

function getPaymentState(row: ListingRow): "paid" | "pending" | "refunded" {
  const explicit = normalize(row.paymentStatus);
  if (explicit === "paid") return "paid";
  if (explicit === "refunded") return "refunded";
  if (explicit === "pending" || explicit === "payment_pending")
    return "pending";

  if (row.paid === true) return "paid";

  if (row.paidAt) {
    const d = new Date(row.paidAt as any);
    if (!Number.isNaN(d.getTime())) return "paid";
  }

  const status = normalize(row.status);
  if (status === "refunded") return "refunded";
  if (status === "payment_pending" || status === "pending_payment")
    return "pending";
  if (
    ["approved", "active", "pending_approval", "expired", "unlinked"].includes(
      status,
    )
  ) {
    return "paid";
  }

  return "pending";
}

function getListingState(
  row: ListingRow,
):
  | "unlinked"
  | "pending_approval"
  | "approved"
  | "active"
  | "expired"
  | "fallback" {
  const explicit = normalize(row.listingStatus);
  if (
    explicit === "unlinked" ||
    explicit === "pending_approval" ||
    explicit === "approved" ||
    explicit === "active" ||
    explicit === "expired"
  ) {
    return explicit as
      | "unlinked"
      | "pending_approval"
      | "approved"
      | "active"
      | "expired";
  }

  const status = normalize(row.status);
  if (
    status === "unlinked" ||
    status === "pending_approval" ||
    status === "approved" ||
    status === "active" ||
    status === "expired"
  ) {
    return status as
      | "unlinked"
      | "pending_approval"
      | "approved"
      | "active"
      | "expired";
  }

  if (isFallbackRow(row)) {
    if (normalize(row.fulfillmentStatus) === "needs_business_link")
      return "unlinked";
    if (row.linkedListingExists) return "active";
    return "fallback";
  }

  if (row.needsAttention) return "unlinked";

  return "fallback";
}

function paymentBadgeClass(state: ReturnType<typeof getPaymentState>) {
  if (state === "paid")
    return "bg-green-500/15 text-green-300 border border-green-500/20";
  if (state === "refunded")
    return "bg-red-500/15 text-red-300 border border-red-500/20";
  return "bg-yellow-500/15 text-yellow-200 border border-yellow-500/20";
}

function listingBadgeClass(state: ReturnType<typeof getListingState>) {
  switch (state) {
    case "active":
      return "bg-green-500/15 text-green-300 border border-green-500/20";
    case "approved":
      return "bg-blue-500/15 text-blue-300 border border-blue-500/20";
    case "pending_approval":
      return "bg-yellow-500/15 text-yellow-200 border border-yellow-500/20";
    case "unlinked":
      return "bg-orange-500/15 text-orange-200 border border-orange-500/20";
    case "expired":
      return "bg-red-500/15 text-red-300 border border-red-500/20";
    default:
      return "bg-zinc-700/40 text-zinc-300 border border-zinc-600";
  }
}

function prettyPaymentState(state: ReturnType<typeof getPaymentState>) {
  if (state === "paid") return "Paid";
  if (state === "refunded") return "Refunded";
  return "Pending";
}

function prettyListingState(state: ReturnType<typeof getListingState>) {
  if (state === "pending_approval") return "Pending Approval";
  if (state === "unlinked") return "Unlinked";
  if (state === "approved") return "Approved";
  if (state === "active") return "Active";
  if (state === "expired") return "Expired";
  return "Fallback Row";
}

function slotText(row: ListingRow): string {
  if (row.featuredSlot) return `Slot ${row.featuredSlot}`;
  if (row.queuePosition) return `Queue #${row.queuePosition}`;
  return "—";
}

export default function DirectoryApprovalsPage() {
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [apiSource, setApiSource] = useState("");
  const [summary, setSummary] = useState<Record<string, any> | null>(null);

  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [listingFilter, setListingFilter] = useState<ListingFilter>("all");
  const [attentionOnly, setAttentionOnly] = useState(false);

  const fetchListings = useCallback(async () => {
    try {
      setError("");

      const res = await fetch(
        "/api/admin/get-directory-listings?source=auto&limit=100",
        {
          credentials: "include",
        },
      );

      const data: ApiResponseShape | unknown = await res
        .json()
        .catch(() => ({}));

      if (!res.ok) {
        const message =
          (data as any)?.error ||
          (data as any)?.message ||
          `Failed to load directory listings (${res.status})`;
        setListings([]);
        setSummary(null);
        setApiSource("");
        setError(message);
        return;
      }

      const rows = toArrayPayload(data);
      setListings(rows);
      setApiSource((data as ApiResponseShape)?.source || "");
      setSummary(((data as ApiResponseShape)?.summary as any) || null);
    } catch (e: any) {
      setListings([]);
      setSummary(null);
      setApiSource("");
      setError(e?.message || "Failed to load directory listings");
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      await fetchListings();
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [fetchListings]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchListings();
    setRefreshing(false);
  };

  const handleApprove = async (listingId: string) => {
    if (!listingId) return;
    const ok = window.confirm("Approve this directory listing?");
    if (!ok) return;

    try {
      const res = await fetch("/api/admin/approve-directory-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ listingId }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert((data as any)?.error || "Approval failed");
        return;
      }

      await fetchListings();
    } catch (err: any) {
      alert(err?.message || "Approval failed");
    }
  };

  const handleExpire = async (listingId: string) => {
    if (!listingId) return;
    const ok = window.confirm("Expire or remove this directory listing?");
    if (!ok) return;

    try {
      const res = await fetch("/api/admin/expire-directory-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ listingId }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert((data as any)?.error || "Expire/Remove failed");
        return;
      }

      await fetchListings();
    } catch (err: any) {
      alert(err?.message || "Expire/Remove failed");
    }
  };

  const filteredListings = useMemo(() => {
    const q = search.trim().toLowerCase();

    return listings.filter((row) => {
      const paymentState = getPaymentState(row);
      const listingState = getListingState(row);
      const fallback = isFallbackRow(row);

      if (paymentFilter !== "all" && paymentState !== paymentFilter)
        return false;

      if (listingFilter !== "all") {
        if (listingFilter === "fallback") {
          if (!fallback) return false;
        } else if (listingState !== listingFilter) {
          return false;
        }
      }

      if (attentionOnly && !row.needsAttention) return false;

      if (!q) return true;

      const haystack = [
        displayName(row),
        row.businessId,
        row.businessIdReal,
        row.userId,
        row.email,
        row.itemId,
        row.stripeSessionId,
        row.paymentIntentId,
        row.fulfillmentStatus,
        row.status,
        row.listingStatus,
        row.paymentStatus,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [attentionOnly, listingFilter, listings, paymentFilter, search]);

  const counts = useMemo(() => {
    const total = listings.length;
    const paid = listings.filter((l) => getPaymentState(l) === "paid").length;
    const pendingPayment = listings.filter(
      (l) => getPaymentState(l) === "pending",
    ).length;
    const refunded = listings.filter(
      (l) => getPaymentState(l) === "refunded",
    ).length;
    const unlinked = listings.filter(
      (l) => getListingState(l) === "unlinked",
    ).length;
    const pendingApproval = listings.filter(
      (l) => getListingState(l) === "pending_approval",
    ).length;
    const approved = listings.filter(
      (l) => getListingState(l) === "approved",
    ).length;
    const active = listings.filter(
      (l) => getListingState(l) === "active",
    ).length;
    const expired = listings.filter(
      (l) => getListingState(l) === "expired",
    ).length;
    const fallback = listings.filter((l) => isFallbackRow(l)).length;
    const needsAttention = listings.filter((l) => !!l.needsAttention).length;

    return {
      total,
      paid,
      pendingPayment,
      refunded,
      unlinked,
      pendingApproval,
      approved,
      active,
      expired,
      fallback,
      needsAttention,
    };
  }, [listings]);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-yellow-300">
              Directory Approvals
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Review directory purchases with payment status and listing
              workflow shown separately.
            </p>
            {apiSource ? (
              <p className="mt-1 text-xs text-zinc-500">
                Source: <span className="text-zinc-300">{apiSource}</span>
              </p>
            ) : null}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="rounded-lg border border-yellow-500/30 bg-zinc-900 px-4 py-2 text-sm text-yellow-200 hover:bg-zinc-800 disabled:opacity-60"
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>

            <Link
              href="/admin/dashboard"
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
            >
              Back to Admin Dashboard
            </Link>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5 xl:grid-cols-10">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
            <p className="text-xs text-zinc-400">Rows Loaded</p>
            <p className="text-lg font-semibold">{counts.total}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
            <p className="text-xs text-zinc-400">Paid</p>
            <p className="text-lg font-semibold text-green-300">
              {counts.paid}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
            <p className="text-xs text-zinc-400">Payment Pending</p>
            <p className="text-lg font-semibold text-yellow-200">
              {counts.pendingPayment}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
            <p className="text-xs text-zinc-400">Refunded</p>
            <p className="text-lg font-semibold text-red-300">
              {counts.refunded}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
            <p className="text-xs text-zinc-400">Unlinked</p>
            <p className="text-lg font-semibold text-orange-200">
              {counts.unlinked}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
            <p className="text-xs text-zinc-400">Pending Approval</p>
            <p className="text-lg font-semibold text-yellow-200">
              {counts.pendingApproval}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
            <p className="text-xs text-zinc-400">Approved</p>
            <p className="text-lg font-semibold text-blue-300">
              {counts.approved}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
            <p className="text-xs text-zinc-400">Active</p>
            <p className="text-lg font-semibold text-green-300">
              {counts.active}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
            <p className="text-xs text-zinc-400">Fallback Rows</p>
            <p className="text-lg font-semibold text-zinc-300">
              {counts.fallback}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
            <p className="text-xs text-zinc-400">Needs Attention</p>
            <p className="text-lg font-semibold text-orange-200">
              {counts.needsAttention}
            </p>
          </div>
        </div>

        {summary ? (
          <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-300">
            <span className="mr-3 text-zinc-400">API Summary:</span>
            {Object.entries(summary).map(([k, v]) => (
              <span key={k} className="mr-3">
                <span className="text-zinc-500">{k}:</span> {String(v)}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Search</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Business, email, session, item..."
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-yellow-500/50"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-zinc-400">
                Payment Filter
              </label>
              <select
                value={paymentFilter}
                onChange={(e) =>
                  setPaymentFilter(e.target.value as PaymentFilter)
                }
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-yellow-500/50"
              >
                <option value="all">All payment states</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-zinc-400">
                Listing Filter
              </label>
              <select
                value={listingFilter}
                onChange={(e) =>
                  setListingFilter(e.target.value as ListingFilter)
                }
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-yellow-500/50"
              >
                <option value="all">All listing states</option>
                <option value="unlinked">Unlinked</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="fallback">Fallback Payment Rows</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200">
                <input
                  type="checkbox"
                  checked={attentionOnly}
                  onChange={(e) => setAttentionOnly(e.target.checked)}
                  className="accent-yellow-400"
                />
                Needs Attention Only
              </label>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-300">
            Loading directory listings...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-6 text-red-200">
            {error}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950">
            <table className="min-w-full text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-900/60 text-left text-zinc-300">
                <tr>
                  <th className="px-4 py-3">Business / Contact</th>
                  <th className="px-4 py-3">Tier</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Listing</th>
                  <th className="px-4 py-3">Slot / Queue</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Paid At</th>
                  <th className="px-4 py-3">Ends</th>
                  <th className="px-4 py-3">Session</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredListings.length === 0 ? (
                  <tr>
                    <td
                      colSpan={11}
                      className="px-4 py-8 text-center text-zinc-400"
                    >
                      No directory listings match the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredListings.map((row, idx) => {
                    const id = asId(row._id);
                    const fallback = isFallbackRow(row);
                    const paymentState = getPaymentState(row);
                    const listingState = getListingState(row);
                    const endsAt = row.featuredEndDate || row.expiresAt || null;

                    const canApprove =
                      !fallback &&
                      !!id &&
                      (listingState === "pending_approval" ||
                        listingState === "unlinked");

                    const canExpire =
                      !fallback &&
                      !!id &&
                      ["approved", "active"].includes(listingState);

                    return (
                      <tr
                        key={id || row.stripeSessionId || `${idx}`}
                        className="border-b border-zinc-800 last:border-b-0"
                      >
                        <td className="px-4 py-3 align-top">
                          <div className="font-medium text-white">
                            {displayName(row)}
                          </div>
                          <div className="mt-1 text-xs text-zinc-500">
                            {row.businessIdReal
                              ? `businessId: ${row.businessIdReal}`
                              : row.businessId
                                ? `businessId: ${row.businessId}`
                                : row.userId
                                  ? `userId: ${row.userId}`
                                  : "No linked business/user"}
                          </div>
                          {fallback ? (
                            <div className="mt-2 inline-flex rounded border border-zinc-700 px-2 py-0.5 text-xs text-zinc-400">
                              Payment fallback row
                            </div>
                          ) : null}
                        </td>

                        <td className="px-4 py-3 align-top capitalize">
                          {tierText(row)}
                        </td>

                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-flex w-fit rounded-full px-2 py-1 text-xs font-medium ${paymentBadgeClass(
                                paymentState,
                              )}`}
                            >
                              {prettyPaymentState(paymentState)}
                            </span>

                            {row.paymentStatus &&
                            normalize(row.paymentStatus) !==
                              normalize(paymentState) ? (
                              <span className="text-xs text-zinc-500">
                                raw: {row.paymentStatus}
                              </span>
                            ) : null}
                          </div>
                        </td>

                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-flex w-fit rounded-full px-2 py-1 text-xs font-medium ${listingBadgeClass(
                                listingState,
                              )}`}
                            >
                              {prettyListingState(listingState)}
                            </span>

                            {row.fulfillmentStatus ? (
                              <span className="text-xs text-zinc-500">
                                {row.fulfillmentStatus}
                              </span>
                            ) : null}

                            {row.needsAttention ? (
                              <span className="inline-flex w-fit rounded-full bg-orange-500/15 px-2 py-1 text-xs text-orange-200 border border-orange-500/20">
                                Needs attention
                              </span>
                            ) : null}
                          </div>
                        </td>

                        <td className="px-4 py-3 align-top">{slotText(row)}</td>

                        <td className="px-4 py-3 align-top">
                          {fmtMoney(row.amountCents)}
                        </td>

                        <td className="px-4 py-3 align-top text-xs text-zinc-300">
                          {fmtDateTime(row.createdAt)}
                        </td>

                        <td className="px-4 py-3 align-top text-xs text-zinc-300">
                          {fmtDateTime(row.paidAt)}
                        </td>

                        <td className="px-4 py-3 align-top">
                          {fmtDate(endsAt)}
                        </td>

                        <td className="px-4 py-3 align-top">
                          <div className="max-w-[220px] truncate text-xs text-zinc-400">
                            {row.stripeSessionId || "—"}
                          </div>
                        </td>

                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-wrap gap-2">
                            {canApprove ? (
                              <button
                                className="rounded bg-yellow-400 px-2 py-1 text-xs font-semibold text-black hover:bg-yellow-300"
                                onClick={() => handleApprove(id)}
                              >
                                Approve
                              </button>
                            ) : null}

                            {canExpire ? (
                              <button
                                className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-500"
                                onClick={() => handleExpire(id)}
                              >
                                Expire / Remove
                              </button>
                            ) : null}

                            {fallback ? (
                              <span className="rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-400">
                                Fallback
                              </span>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
