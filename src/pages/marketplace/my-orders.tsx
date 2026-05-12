import { useEffect, useState } from "react";
import Link from "next/link";

type TimelineStep = {
  key: string;
  label: string;
  done: boolean;
};

type BuyerOrder = {
  _id: string;
  createdAt?: string | null;
  productName?: string;
  totalCents?: number;
  paymentState?: string;
  fulfillmentState?: string;
  orderState?: string;
  sellerName?: string;
  trackingNumber?: string | null;
  trackingCarrier?: string | null;
  timeline?: TimelineStep[];
};

function toneForStatus(status: string) {
  const s = status.toLowerCase();
  if (["paid", "shipped", "delivered", "completed"].includes(s))
    return "text-emerald-300";
  if (["failed", "cancelled", "refunded"].includes(s)) return "text-rose-300";
  return "text-yellow-200";
}

function nextStepForOrder(o: BuyerOrder) {
  const payment = String(o.paymentState || "pending").toLowerCase();
  const fulfillment = String(o.fulfillmentState || "processing").toLowerCase();
  if (payment === "failed")
    return "Retry payment or contact support to complete your order.";
  if (fulfillment === "shipped" && o.trackingNumber)
    return "Use tracking details below for delivery updates.";
  if (fulfillment === "delivered")
    return "Order delivered. If there is an issue, use Need help.";
  return "Seller is preparing your order. Check back soon for shipping updates.";
}

export default function BuyerOrdersPage() {
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/marketplace/get-buyer-orders", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const fallback =
            res.status === 401
              ? "Please sign in to view your marketplace orders."
              : "We could not load your marketplace orders. Please refresh and try again.";
          throw new Error(data?.error || fallback);
        }
        setOrders(Array.isArray(data?.orders) ? data.orders : []);
      } catch (e: any) {
        setError(
          e?.message ||
            "We could not load your marketplace orders. Please refresh and try again.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-black text-[#D4AF37]">
            My Marketplace Orders
          </h1>
          <Link
            href="/marketplace"
            className="text-sm text-[#D4AF37] hover:underline"
          >
            Back to Marketplace
          </Link>
        </div>

        <p className="mt-2 text-sm text-white/70">
          Track payment status, fulfillment status, and shipping status for each
          order.
        </p>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/75 sm:text-sm">
          <p className="font-semibold text-white">Order status legend</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-emerald-300">
              Paid / Shipped / Delivered
            </span>
            <span className="rounded-full border border-yellow-500/40 bg-yellow-500/10 px-2 py-1 text-yellow-200">
              Pending / Processing
            </span>
            <span className="rounded-full border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-rose-300">
              Failed / Cancelled / Refunded
            </span>
          </div>
        </div>

        {loading ? <p className="mt-4 text-white/70">Loading orders…</p> : null}
        {error ? (
          <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-red-200">
            <p>{error}</p>
            <p className="mt-1 text-xs text-red-100/80">
              If you just placed an order, refresh in a moment. If this keeps
              happening, return to Marketplace and try Buy again.
            </p>
          </div>
        ) : null}

        {!loading && !error ? (
          <div className="mt-5 space-y-5">
            {orders.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-white/70">
                <p>
                  No orders found yet. After checkout, your order status appears
                  here.
                </p>
                <p className="mt-1 text-xs text-white/60">
                  Next step: browse products and use Buy now on any listing.
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <Link
                    href="/marketplace"
                    className="text-sm text-[#D4AF37] hover:underline"
                  >
                    Browse products
                  </Link>
                  <Link
                    href="/support/marketplace"
                    className="text-sm text-[#D4AF37] hover:underline"
                  >
                    Marketplace support
                  </Link>
                </div>
              </div>
            ) : (
              orders.map((o) => (
                <article
                  key={o._id}
                  className="rounded-xl border border-white/10 bg-white/5 p-4 md:p-5"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        {o.productName || "Marketplace Product"}
                      </h2>
                      <p className="text-xs text-white/60">
                        Ordered{" "}
                        {o.createdAt
                          ? new Date(o.createdAt).toLocaleString()
                          : "-"}
                      </p>
                    </div>
                    <div className="text-base font-semibold text-gold">
                      ${(Number(o.totalCents || 0) / 100).toFixed(2)}
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm text-white/85 md:grid-cols-3">
                    <p>
                      <span className="text-white/60">Payment status:</span>{" "}
                      <span
                        className={toneForStatus(
                          String(o.paymentState || "pending"),
                        )}
                      >
                        {o.paymentState || "pending"}
                      </span>
                    </p>
                    <p>
                      <span className="text-white/60">Fulfillment status:</span>{" "}
                      <span
                        className={toneForStatus(
                          String(o.fulfillmentState || "processing"),
                        )}
                      >
                        {o.fulfillmentState || "processing"}
                      </span>
                    </p>
                    <p>
                      <span className="text-white/60">Seller:</span>{" "}
                      {o.sellerName || "BWE Marketplace Seller"}
                    </p>
                  </div>

                  {o.trackingNumber ? (
                    <p className="mt-2 text-sm text-emerald-300">
                      Tracking:{" "}
                      {o.trackingCarrier ? `${o.trackingCarrier} ` : ""}
                      {o.trackingNumber}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-white/60">
                      Tracking will appear once seller marks shipped.
                    </p>
                  )}

                  <p className="mt-3 text-xs text-white/75">
                    Next step: {nextStepForOrder(o)}
                  </p>

                  <div className="mt-3">
                    <p className="text-xs uppercase tracking-wide text-white/60">
                      Order timeline
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(o.timeline || []).map((step) => (
                        <div
                          key={step.key}
                          className={`rounded-full border px-3 py-1 text-xs ${step.done ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300" : "border-white/20 bg-black/30 text-white/70"}`}
                        >
                          {step.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3 text-xs sm:text-sm">
                    <Link
                      href="/support/marketplace"
                      className="rounded-lg border border-white/20 px-3 py-2 text-white/90 hover:bg-white/10"
                    >
                      Need help
                    </Link>
                    <Link
                      href="/support/marketplace"
                      className="rounded-lg border border-white/20 px-3 py-2 text-white/90 hover:bg-white/10"
                    >
                      Contact seller
                    </Link>
                    <Link
                      href="/support/new"
                      className="rounded-lg border border-[#D4AF37]/30 px-3 py-2 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                    >
                      Open support ticket
                    </Link>
                  </div>
                </article>
              ))
            )}
          </div>
        ) : null}
      </div>
    </main>
  );
}
