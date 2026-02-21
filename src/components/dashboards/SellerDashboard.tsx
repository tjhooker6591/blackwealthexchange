"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/router";
import {
  PlusCircle,
  Package,
  ShoppingCart,
  BarChart3,
  Store,
  Lock,
  ArrowRight,
  BadgeCheck,
} from "lucide-react";

type Stats = {
  products: number;
  orders: number;
  revenue: number;
};

type StripeStatus = {
  connected: boolean;
  stripeAccountId: string | null;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  requirements: string[];
};

export default function SellerDashboard() {
  const router = useRouter();

  const [stats, setStats] = useState<Stats>({
    products: 0,
    orders: 0,
    revenue: 0,
  });

  const [sellerName, setSellerName] = useState<string>("Seller");
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  // ✅ Stripe payout status
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeWorking, setStripeWorking] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);

  const payoutReady =
    !!stripeStatus?.connected &&
    !!stripeStatus?.detailsSubmitted &&
    !!stripeStatus?.chargesEnabled &&
    !!stripeStatus?.payoutsEnabled;

  const formattedRevenue = useMemo(() => {
    const n = Number(stats.revenue || 0);
    return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
  }, [stats.revenue]);

  async function refreshStripeStatus(signal?: AbortSignal) {
    setStripeLoading(true);
    setStripeError(null);
    try {
      const r = await fetch("/api/stripe/account-status", {
        cache: "no-store",
        credentials: "include",
        signal,
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok)
        throw new Error(data?.error || `Stripe status failed (${r.status})`);
      setStripeStatus(data);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setStripeError(e?.message || "Failed to load Stripe payout status");
    } finally {
      setStripeLoading(false);
    }
  }

  async function startStripeOnboarding() {
    setStripeWorking(true);
    setStripeError(null);
    try {
      const r = await fetch("/api/stripe/create-account-link", {
        method: "POST",
        credentials: "include",
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok)
        throw new Error(
          data?.error || `Stripe onboarding failed (${r.status})`,
        );
      if (!data?.url) throw new Error("Missing Stripe onboarding URL");
      window.location.assign(data.url);
    } catch (e: any) {
      setStripeError(e?.message || "Unable to start Stripe onboarding");
      setStripeWorking(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();

    const verifyAndLoad = async () => {
      try {
        const sessionRes = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
          signal: controller.signal,
        });

        if (!sessionRes.ok) throw new Error("Not logged in");

        const sessionData = await sessionRes.json();
        const u = sessionData?.user;

        if (!u || u.accountType !== "seller") {
          setAccessDenied(true);
          return;
        }

        setSellerName(u.fullName || u.email || "Seller");

        const statsRes = await fetch("/api/marketplace/stats", {
          cache: "no-store",
          credentials: "include",
          signal: controller.signal,
        });

        if (!statsRes.ok) throw new Error("Stats fetch failed");

        const statsData = await statsRes.json();

        setStats({
          products: statsData.products || 0,
          orders: statsData.orders || 0,
          revenue: statsData.revenue || 0,
        });

        // ✅ Load Stripe payout readiness (real)
        await refreshStripeStatus(controller.signal);

        setLastUpdated(Date.now());
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("Failed to load seller dashboard:", err);
          setAccessDenied(true);
        }
      } finally {
        setLoading(false);
      }
    };

    verifyAndLoad();
    return () => controller.abort();
  }, []);

  if (loading) return <DashboardSkeleton />;

  if (accessDenied) {
    return (
      <div className="min-h-[75vh] bg-black text-white relative">
        <GlowBackground />
        <div className="relative max-w-3xl mx-auto p-6 flex items-center justify-center min-h-[75vh]">
          <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl text-center">
            <div className="mx-auto mb-3 h-12 w-12 rounded-full border border-white/10 bg-black/30 flex items-center justify-center">
              <Lock className="h-5 w-5 text-yellow-300" />
            </div>
            <h2 className="text-2xl font-bold text-gold">Access Denied</h2>
            <p className="text-gray-300 mt-2">
              Please log in with a seller account to view the seller dashboard.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => router.push("/auth/seller-login")}
                className="px-5 py-2 rounded-xl bg-gold text-black font-semibold hover:bg-yellow-500 transition"
              >
                Seller Login
              </button>
              <button
                onClick={() => router.push("/marketplace/become-a-seller")}
                className="px-5 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
              >
                Become a Seller
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusPill = stripeLoading
    ? {
        text: "Checking…",
        cls: "border-white/10 bg-black/30 text-gray-200",
      }
    : payoutReady
      ? {
          text: "Payouts Enabled",
          cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
        }
      : stripeStatus?.connected
        ? {
            text: "Setup Required",
            cls: "border-yellow-500/30 bg-yellow-500/10 text-yellow-200",
          }
        : {
            text: "Not Connected",
            cls: "border-yellow-500/30 bg-yellow-500/10 text-yellow-200",
          };

  return (
    <div className="min-h-screen bg-black text-white relative">
      <GlowBackground />

      <div className="relative max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gold tracking-tight">
              Seller Dashboard
            </h1>
            <p className="text-gray-300 mt-1">
              Welcome,{" "}
              <span className="text-white font-semibold">{sellerName}</span>.
              Manage products, orders, and payouts.
            </p>
            {lastUpdated ? (
              <p className="text-xs text-gray-500 mt-2">
                Last updated:{" "}
                {new Date(lastUpdated).toLocaleString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/marketplace/add-products"
              className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-gold text-black font-semibold hover:bg-yellow-500 transition"
            >
              <PlusCircle className="h-4 w-4" />
              Add Product
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/marketplace"
              className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
            >
              <Store className="h-4 w-4 text-yellow-300" />
              View Marketplace
            </Link>
          </div>
        </div>

        {/* Top Stats */}
        <div className="grid gap-6 md:grid-cols-3">
          <StatTile
            icon={<Package className="h-5 w-5 text-yellow-300" />}
            label="Products Listed"
            value={stats.products}
          />
          <StatTile
            icon={<ShoppingCart className="h-5 w-5 text-yellow-300" />}
            label="Orders Received"
            value={stats.orders}
          />
          <StatTile
            icon={<BarChart3 className="h-5 w-5 text-yellow-300" />}
            label="Total Revenue"
            value={formattedRevenue}
          />
        </div>

        {/* ✅ Payout status (REAL) */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gold">Payout Status</h2>
              <p className="text-sm text-gray-400 mt-1">
                Stripe payouts must be enabled before you can receive funds to
                your bank.
              </p>
              {stripeError ? (
                <p className="mt-2 text-sm text-red-300">{stripeError}</p>
              ) : null}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-semibold ${statusPill.cls}`}
              >
                {payoutReady ? <BadgeCheck className="h-4 w-4" /> : null}
                {statusPill.text}
              </span>

              <button
                onClick={() => refreshStripeStatus()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm"
              >
                Refresh
              </button>

              {!payoutReady ? (
                <button
                  onClick={startStripeOnboarding}
                  disabled={stripeWorking}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold text-black font-semibold hover:bg-yellow-500 transition text-sm disabled:opacity-60"
                >
                  {stripeWorking
                    ? "Opening…"
                    : stripeStatus?.connected
                      ? "Finish Stripe Setup"
                      : "Connect Stripe"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>

          {!stripeLoading &&
          !payoutReady &&
          stripeStatus?.requirements?.length ? (
            <p className="mt-4 text-xs text-gray-400">
              Stripe still needs:{" "}
              <span className="text-gray-300">
                {stripeStatus.requirements.join(", ")}
              </span>
            </p>
          ) : null}

          {!stripeLoading && payoutReady ? (
            <p className="mt-4 text-sm text-gray-300">
              ✅ You’re ready — buyers can now check out your products.
            </p>
          ) : null}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ActionCard
            icon={<PlusCircle className="h-5 w-5 text-yellow-300" />}
            title="Add Product"
            description="Publish a new listing in the marketplace."
            href="/marketplace/add-products"
          />
          <ActionCard
            icon={<Package className="h-5 w-5 text-yellow-300" />}
            title="My Products"
            description="Edit, delete, and manage your products."
            href="/marketplace/dashboard"
          />
          <ActionCard
            icon={<ShoppingCart className="h-5 w-5 text-yellow-300" />}
            title="Orders"
            description="Track customer orders and fulfillment status."
            href="/marketplace/orders"
          />
          <ActionCard
            icon={<BarChart3 className="h-5 w-5 text-yellow-300" />}
            title="Analytics"
            description="Understand sales performance and trends."
            href="/marketplace/analytics"
          />
        </div>
      </div>
    </div>
  );
}

/* ───────────── UI Helpers ───────────── */

function GlowBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 opacity-60">
      <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-yellow-500/10 blur-3xl" />
      <div className="absolute top-[38%] left-[12%] h-[320px] w-[320px] rounded-full bg-yellow-500/5 blur-3xl" />
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
      <div className="flex items-center gap-2 text-gray-200">
        <div className="h-10 w-10 rounded-xl border border-white/10 bg-black/30 flex items-center justify-center">
          {icon}
        </div>
        <div className="text-sm text-gray-300">{label}</div>
      </div>
      <div className="mt-4 text-4xl font-extrabold text-white">{value}</div>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  description,
  href,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href} className="block">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl hover:bg-white/10 hover:shadow-2xl transition">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl border border-white/10 bg-black/30 flex items-center justify-center">
            {icon}
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-white">{title}</h3>
            <p className="text-sm text-gray-400 mt-1">{description}</p>
          </div>
        </div>
        <div className="mt-5 inline-flex items-center gap-2 text-gold font-semibold">
          Open <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-black text-white relative">
      <GlowBackground />
      <div className="relative max-w-6xl mx-auto p-6 space-y-6">
        <div className="h-10 w-2/3 bg-white/10 rounded animate-pulse" />
        <div className="h-5 w-1/2 bg-white/10 rounded animate-pulse" />

        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl"
            >
              <div className="h-6 w-1/2 bg-white/10 rounded animate-pulse" />
              <div className="mt-4 h-10 w-1/3 bg-white/10 rounded animate-pulse" />
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
          <div className="h-6 w-1/3 bg-white/10 rounded animate-pulse" />
          <div className="mt-4 h-24 bg-white/10 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
