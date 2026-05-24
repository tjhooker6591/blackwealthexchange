import { useEffect, useState } from "react";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";

type Order = {
  _id: string;
  createdAt?: string;
  totalPrice?: number;
  status?: string;
  orderState?: string;
  productName?: string;
  buyerEmail?: string;
  paymentState?: string;
  fulfillmentState?: string;
  trackingNumber?: string | null;
  trackingCarrier?: string | null;
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
  if (
    ["paid", "processing", "pending_fulfillment", "pending"].includes(status)
  ) {
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
  const [fulfillmentStateById, setFulfillmentStateById] = useState<
    Record<string, string>
  >({});
  const [trackingNumberById, setTrackingNumberById] = useState<
    Record<string, string>
  >({});
  const [trackingCarrierById, setTrackingCarrierById] = useState<
    Record<string, string>
  >({});
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string>("");

  async function loadOrders() {
    const res = await fetch("/api/marketplace/get-orders", {
      credentials: "include",
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const fallback =
        res.status === 401
          ? "Please sign in with a seller account to view seller orders."
          : "We could not load seller orders. Please refresh and try again.";
      throw new Error(data?.error || fallback);
    }
    const loaded = Array.isArray(data?.orders) ? data.orders : [];
    setOrders(loaded);

    const initialState: Record<string, string> = {};
    const initialTracking: Record<string, string> = {};
    const initialCarrier: Record<string, string> = {};
    for (const o of loaded) {
      initialState[o._id] = String(o.fulfillmentState || "processing");
      initialTracking[o._id] = String(o.trackingNumber || "");
      initialCarrier[o._id] = String(o.trackingCarrier || "");
    }
    setFulfillmentStateById(initialState);
    setTrackingNumberById(initialTracking);
    setTrackingCarrierById(initialCarrier);
  }

  useEffect(() => {
    (async () => {
      try {
        await loadOrders();

        const stripeRes = await fetch("/api/stripe/account-status", {
          credentials: "include",
          cache: "no-store",
        });
        const stripeData = await stripeRes.json().catch(() => ({}));
        if (stripeRes.ok) setStripeStatus(stripeData);
      } catch (e: any) {
        setError(
          e?.message ||
            "We could not load seller orders. Please refresh and try again.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function saveFulfillment(orderId: string) {
    try {
      setSaveError("");
      setSavingOrderId(orderId);
      const res = await fetch("/api/marketplace/update-order-fulfillment", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          fulfillmentState: fulfillmentStateById[orderId] || "processing",
          trackingNumber: trackingNumberById[orderId] || "",
          trackingCarrier: trackingCarrierById[orderId] || "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data?.error || "Failed to update fulfillment");
      await loadOrders();
    } catch (e: any) {
      setSaveError(
        e?.message ||
          "Fulfillment update was not saved. Check inputs and try again.",
      );
    } finally {
      setSavingOrderId(null);
    }
  }

  const actionableOrders = orders.filter((o) => {
    const s = normalizeOrderStatus(o);
    return ["paid", "processing", "pending", "pending_fulfillment"].includes(s);
  });

  const pendingFulfillment = orders.filter((o) => {
    const s = String(o.fulfillmentState || "processing").toLowerCase();
    return ["processing", "pending", "pending_fulfillment", "paid"].includes(s);
  });

  const payoutReady =
    !!stripeStatus?.connected &&
    !!stripeStatus?.detailsSubmitted &&
    !!stripeStatus?.chargesEnabled &&
    !!stripeStatus?.payoutsEnabled;

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-5xl">
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
        {saveError ? <p className="mt-2 text-red-400">{saveError}</p> : null}

        {!loading && !error ? (
          <section className="mt-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
            <h2 className="text-base font-bold text-[#D4AF37]">
              Action Required
            </h2>
            <ul className="mt-2 space-y-2 text-sm text-white/85">
              <li>
                New orders needing review:{" "}
                <span className="font-semibold text-white">
                  {actionableOrders.length}
                </span>
              </li>
              <li>
                Orders needing fulfillment:{" "}
                <span className="font-semibold text-white">
                  {pendingFulfillment.length}
                </span>
              </li>
              <li>
                Payout status:{" "}
                {payoutReady ? (
                  <span className="font-semibold text-emerald-300">Ready</span>
                ) : (
                  <span className="font-semibold text-yellow-200">
                    Setup required, finish Stripe onboarding
                  </span>
                )}
              </li>
            </ul>
            {!payoutReady ? (
              <Link
                href="/marketplace/become-a-seller?refresh=1"
                className="mt-3 inline-block text-sm underline text-[#D4AF37]"
              >
                Complete payout setup
              </Link>
            ) : null}
          </section>
        ) : null}

        {!loading && !error ? (
          <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-white/5 text-left text-white/70">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Product</th>
                  <th className="p-3">Buyer</th>
                  <th className="p-3">Order state</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Fulfillment actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td className="p-5 text-white/70" colSpan={6}>
                      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                        <p className="font-semibold text-white">
                          No orders yet
                        </p>
                        <p className="mt-1 text-sm text-white/70">
                          Next step: add a product and publish inventory so
                          buyers can place orders.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Link
                            href="/marketplace/add-products"
                            className="rounded border border-[#D4AF37] px-3 py-1.5 text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black"
                          >
                            Add product
                          </Link>
                          <Link
                            href="/dashboard/seller/products"
                            className="rounded border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/90 hover:bg-white/10"
                          >
                            Manage products
                          </Link>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr
                      key={o._id}
                      className="border-t border-white/10 align-top"
                    >
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
                      <td className="p-3">
                        <div className="space-y-2 min-w-[220px]">
                          <p className="text-xs text-white/60">
                            Payment status:{" "}
                            {String(o.paymentState || "pending").toLowerCase()}
                          </p>
                          <p className="text-xs text-white/60">
                            Current fulfillment status:{" "}
                            {String(
                              o.fulfillmentState || "processing",
                            ).toLowerCase()}
                          </p>
                          <select
                            value={fulfillmentStateById[o._id] || "processing"}
                            onChange={(e) =>
                              setFulfillmentStateById((prev) => ({
                                ...prev,
                                [o._id]: e.target.value,
                              }))
                            }
                            className="w-full rounded border border-white/20 bg-black/40 px-2 py-1.5"
                          >
                            <option value="processing">processing</option>
                            <option value="fulfilled">fulfilled</option>
                            <option value="shipped">shipped</option>
                          </select>
                          <input
                            value={trackingCarrierById[o._id] || ""}
                            onChange={(e) =>
                              setTrackingCarrierById((prev) => ({
                                ...prev,
                                [o._id]: e.target.value,
                              }))
                            }
                            placeholder="Tracking carrier (optional)"
                            className="w-full rounded border border-white/20 bg-black/40 px-2 py-1.5"
                          />
                          <input
                            value={trackingNumberById[o._id] || ""}
                            onChange={(e) =>
                              setTrackingNumberById((prev) => ({
                                ...prev,
                                [o._id]: e.target.value,
                              }))
                            }
                            placeholder="Tracking number (optional)"
                            className="w-full rounded border border-white/20 bg-black/40 px-2 py-1.5"
                          />
                          <button
                            onClick={() => saveFulfillment(o._id)}
                            disabled={savingOrderId === o._id}
                            className="w-full rounded border border-[#D4AF37] px-2 py-1.5 font-semibold text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black disabled:opacity-60"
                          >
                            {savingOrderId === o._id
                              ? "Saving..."
                              : "Update fulfillment"}
                          </button>
                        </div>
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

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const cookies = cookie.parse(req.headers.cookie || "");
  const token = cookies.session_token;

  if (!token) {
    return {
      redirect: {
        destination: "/login?redirect=/marketplace/orders",
        permanent: false,
      },
    };
  }

  try {
    const payload = jwt.verify(token, getJwtSecret()) as {
      accountType?: string;
    };
    if (payload.accountType !== "seller") {
      return {
        redirect: {
          destination: "/login?redirect=/marketplace/orders",
          permanent: false,
        },
      };
    }
  } catch {
    return {
      redirect: {
        destination: "/login?redirect=/marketplace/orders",
        permanent: false,
      },
    };
  }

  return { props: {} };
};
