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
          Track payment status, fulfillment status, and shipping status for each order.
        </p>

        {loading ? <p className="mt-4 text-white/70">Loading orders…</p> : null}
        {error ? <p className="mt-4 text-red-400">{error}</p> : null}

        {!loading && !error ? (
          <div className="mt-4 space-y-4">
            {orders.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-white/70">
                No orders found yet. After checkout, your order status appears
                here.
              </div>
            ) : (
              orders.map((o) => (
                <article
                  key={o._id}
                  className="rounded-xl border border-white/10 bg-white/5 p-4"
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
                    <div className="text-sm text-white/80">
                      ${(Number(o.totalCents || 0) / 100).toFixed(2)}
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm text-white/85 md:grid-cols-3">
                    <p>
                      <span className="text-white/60">Payment status:</span>{" "}
                      {o.paymentState || "pending"}
                    </p>
                    <p>
                      <span className="text-white/60">Fulfillment status:</span>{" "}
                      {o.fulfillmentState || "processing"}
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

                  <div className="mt-3">
                    <p className="text-xs uppercase tracking-wide text-white/60">
                      Order timeline
                    </p>
                    <div className="mt-2 flex gap-2">
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
                </article>
              ))
            )}
          </div>
        ) : null}
      </div>
    </main>
  );
}
