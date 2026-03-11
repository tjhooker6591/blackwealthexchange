import { useEffect, useState } from "react";
import Link from "next/link";

type Order = {
  _id: string;
  createdAt?: string;
  totalPrice?: number;
  status?: string;
  productName?: string;
  buyerEmail?: string;
};

export default function MarketplaceOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      } catch (e: any) {
        setError(e?.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
                      <td className="p-3">{o.status || "pending"}</td>
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
