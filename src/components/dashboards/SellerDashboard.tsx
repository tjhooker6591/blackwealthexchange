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
  AlertTriangle,
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

type SellerUser = {
  fullName?: string;
  email?: string;
  accountType?: string;
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

  // Separate data/system errors from true auth denial
  const [dataError, setDataError] = useState<string | null>(null);

  // Stripe payout status
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

      if (!r.ok) {
        throw new Error(data?.error || `Stripe status failed (${r.status})`);
      }

      setStripeStatus(data);
    } catch (e: any) {
      if (e?.name === "AbortError") return;

      console.error("Stripe status error:", e);
      setStripeStatus(null);
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

      if (!r.ok) {
        throw new Error(
          data?.error || `Stripe onboarding failed (${r.status})`,
        );
      }

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
        setLoading(true);
        setAccessDenied(false);
        setDataError(null);

        const sessionRes = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
          signal: controller.signal,
        });

        if (!sessionRes.ok) {
          setAccessDenied(true);
          return;
        }

        const sessionData = await sessionRes.json();
        const u: SellerUser | undefined = sessionData?.user;

        if (!u || u.accountType !== "seller") {
          setAccessDenied(true);
          return;
        }

        setSellerName(u.fullName || u.email || "Seller");

        let hadDataIssue = false;

        // Stats load should NOT trigger Access Denied
        try {
          const statsRes = await fetch("/api/marketplace/stats", {
            cache: "no-store",
            credentials: "include",
            signal: controller.signal,
          });

          if (!statsRes.ok) {
            hadDataIssue = true;
          } else {
            const statsData = await statsRes.json();

            setStats({
              products: statsData.products || 0,
              orders: statsData.orders || 0,
              revenue: statsData.revenue || 0,
            });
          }
        } catch (err: any) {
          if (err?.name !== "AbortError") {
            console.error("Stats fetch failed:", err);
            hadDataIssue = true;
          }
        }

        // Stripe status load should NOT trigger Access Denied
        try {
          await refreshStripeStatus(controller.signal);
        } catch {
          hadDataIssue = true;
        }

        if (hadDataIssue) {
          setDataError(
            "Some seller dashboard data could not be loaded right now. Your seller account is still active.",
          );
        }

        setLastUpdated(Date.now());
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("Failed to load seller dashboard:", err);
          setDataError(
            "We had trouble loading your seller dashboard. Please refresh and try again.",
          );
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
        <div className="relative mx-auto flex min-h-[75vh] max-w-3xl items-center justify-center px-3 py-5 sm:px-4 sm:py-8">
          <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-center shadow-xl sm:p-6">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/30 sm:h-12 sm:w-12">
              <Lock className="h-5 w-5 text-yellow-300" />
            </div>
            <h2 className="text-xl font-bold text-gold sm:text-2xl">
              Access Denied
            </h2>
            <p className="mt-2 text-sm text-gray-300">
              Please log in with a seller account to view the seller dashboard.
            </p>
            <div className="mt-6 grid gap-3 sm:flex sm:flex-row sm:justify-center">
              <button
                onClick={() => router.push("/auth/seller-login")}
                className="w-full rounded-xl bg-gold px-5 py-2.5 font-semibold text-black transition hover:bg-yellow-500 sm:w-auto"
              >
                Seller Login
              </button>
              <button
                onClick={() => router.push("/marketplace/become-a-seller")}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 transition hover:bg-white/10 sm:w-auto"
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

      <div className="relative mx-auto max-w-6xl space-y-6 px-3 py-5 sm:space-y-8 sm:px-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gold sm:text-3xl md:text-4xl">
              Seller Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-300 sm:text-base">
              Welcome,{" "}
              <span className="font-semibold text-white">{sellerName}</span>.
              Manage products, orders, and payouts.
            </p>
            {lastUpdated ? (
              <p className="mt-2 text-xs text-gray-500">
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

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:gap-3">
            <Link
              href="/marketplace/add-products"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-center text-sm font-semibold text-black transition hover:bg-yellow-500 sm:px-5"
            >
              <PlusCircle className="h-4 w-4" />
              Add Product
            </Link>

            <Link
              href="/marketplace"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-center text-sm transition hover:bg-white/10 sm:px-5"
            >
              <Store className="h-4 w-4 text-yellow-300" />
              Marketplace
            </Link>
          </div>
        </div>

        {/* Data/system warning */}
        {dataError ? (
          <div className="rounded-2xl border border-yellow-500/25 bg-yellow-500/10 p-4 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-yellow-500/20 bg-black/30">
                <AlertTriangle className="h-5 w-5 text-yellow-300" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gold sm:text-base">
                  Seller dashboard data is partially unavailable
                </h3>
                <p className="mt-1 text-sm text-gray-300">{dataError}</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Top Stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-6">
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
          <div className="col-span-2 lg:col-span-1">
            <StatTile
              icon={<BarChart3 className="h-5 w-5 text-yellow-300" />}
              label="Total Revenue"
              value={formattedRevenue}
            />
          </div>
        </div>

        {/* Payout status */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gold sm:text-xl">
                Payout Status
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Stripe payouts must be enabled before you can receive funds to
                your bank.
              </p>
              {stripeError ? (
                <p className="mt-2 text-sm text-red-300">{stripeError}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-start md:justify-end">
              <span
                className={`inline-flex items-center justify-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${statusPill.cls}`}
              >
                {payoutReady ? <BadgeCheck className="h-4 w-4" /> : null}
                {statusPill.text}
              </span>

              <button
                onClick={() => refreshStripeStatus()}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10"
              >
                Refresh
              </button>

              {!payoutReady ? (
                <button
                  onClick={startStripeOnboarding}
                  disabled={stripeWorking}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-black transition hover:bg-yellow-500 disabled:opacity-60"
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
        <div className="grid gap-3 md:grid-cols-2 md:gap-6">
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

/* UI Helpers */

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
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl sm:p-6">
      <div className="flex items-start gap-2 text-gray-200">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/30 sm:h-10 sm:w-10">
          {icon}
        </div>
        <div className="min-w-0 text-xs text-gray-300 sm:text-sm">{label}</div>
      </div>
      <div className="mt-3 break-words text-2xl font-extrabold text-white sm:mt-4 sm:text-4xl">
        {value}
      </div>
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
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl transition hover:bg-white/10 hover:shadow-2xl sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/30">
            {icon}
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-extrabold text-white sm:text-xl">
              {title}
            </h3>
            <p className="mt-1 text-sm text-gray-400">{description}</p>
          </div>
        </div>
        <div className="mt-4 inline-flex items-center gap-2 font-semibold text-gold sm:mt-5">
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
      <div className="relative mx-auto max-w-6xl space-y-5 px-3 py-5 sm:space-y-6 sm:px-4 sm:py-8">
        <div className="h-8 w-2/3 animate-pulse rounded bg-white/10 sm:h-10" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-white/10 sm:h-5" />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl sm:p-6"
            >
              <div className="h-5 w-1/2 animate-pulse rounded bg-white/10 sm:h-6" />
              <div className="mt-4 h-8 w-1/3 animate-pulse rounded bg-white/10 sm:h-10" />
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl sm:p-6">
          <div className="h-5 w-1/3 animate-pulse rounded bg-white/10 sm:h-6" />
          <div className="mt-4 h-24 animate-pulse rounded bg-white/10" />
        </div>

        <div className="grid gap-3 md:grid-cols-2 md:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl sm:p-6"
            >
              <div className="h-6 w-1/2 animate-pulse rounded bg-white/10" />
              <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-white/10" />
              <div className="mt-5 h-4 w-1/4 animate-pulse rounded bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
