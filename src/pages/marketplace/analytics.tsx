import { useEffect, useState } from "react";
import Link from "next/link";

export default function MarketplaceAnalyticsPage() {
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/marketplace/stats", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to load analytics");
        setStats({
          products: Number(data?.products || 0),
          orders: Number(data?.orders || 0),
          revenue: Number(data?.revenue || 0),
        });
      } catch (e: any) {
        setError(e?.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black text-[#D4AF37]">
            Seller Analytics
          </h1>
          <Link
            href="/marketplace/dashboard"
            className="text-sm text-[#D4AF37] hover:underline"
          >
            Back to Dashboard
          </Link>
        </div>

        {loading ? (
          <p className="mt-4 text-white/70">Loading analytics…</p>
        ) : null}
        {error ? <p className="mt-4 text-red-400">{error}</p> : null}

        {!loading && !error ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-white/60">Products</p>
              <p className="mt-2 text-2xl font-extrabold">{stats.products}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-white/60">Orders</p>
              <p className="mt-2 text-2xl font-extrabold">{stats.orders}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-white/60">Revenue</p>
              <p className="mt-2 text-2xl font-extrabold">
                ${stats.revenue.toFixed(2)}
              </p>
            </div>
          </div>
        ) : null}

        {!loading && !error ? (
          <section className="mt-5 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
            <h2 className="text-base font-bold text-[#D4AF37]">Next action</h2>
            <p className="mt-1 text-sm text-white/80">
              Use analytics to tune listings, then return to products and orders
              to improve conversion.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/dashboard/seller/products"
                className="rounded border border-[#D4AF37] px-3 py-1.5 text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black"
              >
                Review listings
              </Link>
              <Link
                href="/marketplace/orders"
                className="rounded border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/90 hover:bg-white/10"
              >
                Open orders
              </Link>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
