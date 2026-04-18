import { useEffect, useState } from "react";
import Link from "next/link";

type Order = {
  _id: string;
  createdAt?: string;
  totalPrice?: number;
  status?: string;
  orderState?: string;
  productName?: string;
  buyerEmail?: string;
};

type StripeStatus = {
  connected?: boolean;
  detailsSubmitted?: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
};

function normalizeOrderStatus(order: Order): string {
  return String(order.orderState || order.status || "pending").toLowerCase();
}

function statusBadge(status: string) {
  if (["fulfilled", "shipped", "completed"].includes(status)) {
    return "bg-emerald-500/15 text-emerald-300 border-emerald-400/40";
  }
  if (["paid", "processing", "pending_fulfillment", "pending"].includes(status)) {
    return "bg-yellow-500/15 text-yellow-200 border-yellow-400/40";
  }
  if (["cancelled", "canceled", "failed", "refunded"].includes(status)) {
    return "bg-red-500/15 text-red-300 border-red-400/40";
  }
  return "bg-white/10 text-white/80 border-white/20";
}

export default function MarketplaceOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/marketplace/get-orders", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to load orders");
        setOrders(Array.isArray(data?.orders) ? data.orders : []);

        const stripeRes = await fetch("/api/stripe/account-status", {
          credentials: "include",
          cache: "no-store",
        });
        const stripeData = await stripeRes.json().catch(() => ({}));
        if (stripeRes.ok) setStripeStatus(stripeData);
      } catch (e: any) {
        setError(e?.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const actionableOrders = orders.filter((o) => {
    const s = normalizeOrderStatus(o);
    return ["paid", "processing", "pending", "pending_fulfillment"].includes(s);
  });

  const pendingFulfillment = orders.filter((o) => {
    const s = normalizeOrderStatus(o);
    return ["paid", "processing", "pending_fulfillment"].includes(s);
  });

  const payoutReady =
    !!stripeStatus?.connected &&
    !!stripeStatus?.detailsSubmitted &&
    !!stripeStatus?.chargesEnabled &&
    !!stripeStatus?.payoutsEnabled;

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black text-[#D4AF37]">Seller Orders</h1>
          <Link
            href="/marketplace/dashboard"
            className="text-sm text-[#D4AF37] hover:underline"
          >
            Back to Dashboard
          </Link>
        </div>

        {loading ? <p className="mt-4 text-white/70">Loading orders…</p> : null}
        {error ? <p className="mt-4 text-red-400">{error}</p> : null}

        {!loading && !error ? (
          <section className="mt-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
            <h2 className="text-base font-bold text-[#D4AF37]">Action Required</h2>
            <ul className="mt-2 space-y-2 text-sm text-white/85">
              <li>
                New orders needing review: <span className="font-semibold text-white">{actionableOrders.length}</span>
              </li>
              <li>
                Pending fulfillment: <span className="font-semibold text-white">{pendingFulfillment.length}</span>
              </li>
              <li>
                Payout status: {payoutReady ? (
                  <span className="font-semibold text-emerald-300">Ready</span>
                ) : (
                  <span className="font-semibold text-yellow-200">Setup required, finish Stripe onboarding</span>
                )}
              </li>
            </ul>
            {!payoutReady ? (
              <Link href="/marketplace/become-a-seller?refresh=1" className="mt-3 inline-block text-sm underline text-[#D4AF37]">
                Complete payout setup
              </Link>
            ) : null}
          </section>
        ) : null}

        {!loading && !error ? (
          <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-left text-white/70">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Product</th>
                  <th className="p-3">Buyer</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td className="p-3 text-white/60" colSpan={5}>
                      No orders yet.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o._id} className="border-t border-white/10">
                      <td className="p-3">
                        {o.createdAt
                          ? new Date(o.createdAt).toLocaleString()
                          : "-"}
                      </td>
                      <td className="p-3">{o.productName || "-"}</td>
                      <td className="p-3">{o.buyerEmail || "-"}</td>
                      <td className="p-3">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${statusBadge(normalizeOrderStatus(o))}`}
                        >
                          {normalizeOrderStatus(o).replaceAll("_", " ")}
                        </span>
                      </td>
                      <td className="p-3">
                        ${Number(o.totalPrice || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </main>
  );
}
