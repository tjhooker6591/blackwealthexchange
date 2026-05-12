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
  statusUnavailable?: boolean;
  statusMessage?: string;
};

type SellerUser = {
  fullName?: string;
  email?: string;
  accountType?: string;
};

type Readiness = {
  sellerExists: boolean;
  readinessState: "not_started" | "in_progress" | "ready_to_sell";
  readinessLabel: "Not started" | "In progress" | "Ready to sell";
  readinessProgress: number;
  readinessChecks?: {
    profileValid: boolean;
    publishedProduct: boolean;
  };
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
  const [dataError, setDataError] = useState<string | null>(null);

  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeWorking, setStripeWorking] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);

  const [readiness, setReadiness] = useState<Readiness | null>(null);

  const payoutReady =
    !!stripeStatus?.connected &&
    !!stripeStatus?.detailsSubmitted &&
    !!stripeStatus?.chargesEnabled &&
    !!stripeStatus?.payoutsEnabled;

  const formattedRevenue = useMemo(() => {
    const n = Number(stats.revenue || 0);
    return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
  }, [stats.revenue]);

  const readinessProgress = Math.max(
    0,
    Math.min(2, Number(readiness?.readinessProgress || 0)),
  );
  const readinessPercent = Math.round((readinessProgress / 2) * 100);

  const onboardingSteps = [
    {
      id: "add",
      label: "Add first product",
      description: "Create your first listing with photos, pricing, and stock.",
      done: stats.products > 0,
      href: "/marketplace/add-products",
      cta: stats.products > 0 ? "Add another product" : "Add first product",
    },
    {
      id: "publish",
      label: "Publish product",
      description:
        "A listing is considered published when it is active and visible to buyers.",
      done: Boolean(readiness?.readinessChecks?.publishedProduct),
      href: "/dashboard/seller/products",
      cta: "Review listing status",
    },
    {
      id: "manage",
      label: "View and manage listings",
      description:
        "Edit inventory, pricing, and product details from one place.",
      done: stats.products > 0,
      href: "/dashboard/seller/products",
      cta: "Manage listings",
    },
    {
      id: "orders",
      label: "Begin receiving orders",
      description:
        "Monitor new orders, then mark fulfillment as you process them.",
      done: stats.orders > 0,
      href: "/marketplace/orders",
      cta: stats.orders > 0 ? "Manage orders" : "Open orders",
    },
  ];

  const nextStep = useMemo(() => {
    if (!readiness?.readinessChecks?.profileValid) {
      return {
        title: "Complete seller profile",
        body: "Add required seller profile details so your storefront is complete.",
        href: "/marketplace/become-a-seller?refresh=1",
        cta: "Complete profile",
      };
    }

    if (!stats.products) {
      return {
        title: "Add your first product",
        body: "Create your first listing to begin onboarding progress.",
        href: "/marketplace/add-products",
        cta: "Add first product",
      };
    }

    if (!readiness?.readinessChecks?.publishedProduct) {
      return {
        title: "Publish a product",
        body: "Set at least one listing active so buyers can find it.",
        href: "/dashboard/seller/products",
        cta: "Publish now",
      };
    }

    return {
      title: "Optimize for first sale",
      body: "You are ready to sell. Keep listings fresh and monitor orders daily.",
      href: "/dashboard/seller/products",
      cta: "Review listings",
    };
  }, [readiness, stats.products]);

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
          if (err?.name !== "AbortError") hadDataIssue = true;
        }

        try {
          const readinessRes = await fetch("/api/marketplace/readiness", {
            cache: "no-store",
            credentials: "include",
            signal: controller.signal,
          });
          if (!readinessRes.ok) {
            hadDataIssue = true;
          } else {
            const readinessData = await readinessRes.json();
            setReadiness(readinessData);
          }
        } catch (err: any) {
          if (err?.name !== "AbortError") hadDataIssue = true;
        }

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

  return (
    <div className="min-h-screen bg-black text-white relative">
      <GlowBackground />
      <div className="relative mx-auto max-w-6xl space-y-6 px-3 py-5 sm:space-y-8 sm:px-4 sm:py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gold sm:text-3xl md:text-4xl">
              Seller Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-300 sm:text-base">
              Welcome,{" "}
              <span className="font-semibold text-white">{sellerName}</span>.
            </p>
            {lastUpdated ? (
              <p className="mt-2 text-xs text-gray-500">
                Last updated: {new Date(lastUpdated).toLocaleString()}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:gap-3">
            <Link
              href="/marketplace/add-products"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-center text-sm font-semibold text-black transition hover:bg-yellow-500 sm:px-5"
            >
              <PlusCircle className="h-4 w-4" /> Add Product
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-center text-sm transition hover:bg-white/10 sm:px-5"
            >
              <Store className="h-4 w-4 text-yellow-300" /> Marketplace
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl sm:p-5">
          <h2 className="text-lg font-bold text-gold">Seller readiness</h2>
          <p className="mt-1 text-sm text-gray-300">
            State:{" "}
            <span className="font-semibold text-white">
              {readiness?.readinessLabel || "Not started"}
            </span>
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-gold transition-all"
              style={{ width: `${readinessPercent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-gray-400">
            Progress: {readinessProgress}/2 ({readinessPercent}%)
          </p>
          <div className="mt-3 text-sm text-gray-300 space-y-1">
            <div>
              {readiness?.readinessChecks?.profileValid ? "✅" : "⬜"} Valid
              seller profile
            </div>
            <div>
              {readiness?.readinessChecks?.publishedProduct ? "✅" : "⬜"} At
              least one published product
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-yellow-500/25 bg-yellow-500/10 p-4 shadow-xl sm:p-5">
          <h2 className="text-lg font-bold text-gold">Next step</h2>
          <p className="mt-1 text-sm text-gray-300">{nextStep.body}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={nextStep.href}
              className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-500"
            >
              {nextStep.cta} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/marketplace/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              Refresh dashboard
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl sm:p-6">
          <h2 className="text-lg font-bold text-gold">
            Guided onboarding flow
          </h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {onboardingSteps.map((step, idx) => (
              <div
                key={step.id}
                className="rounded-xl border border-white/10 bg-black/30 p-3"
              >
                <p className="text-sm font-semibold text-white">
                  {idx + 1}. {step.label}
                </p>
                <p className="mt-1 text-xs text-gray-400">{step.description}</p>
                <p className="mt-2 text-xs">
                  {step.done ? "✅ Done" : "⬜ Pending"}
                </p>
                <Link
                  href={step.href}
                  className="mt-2 inline-flex items-center gap-1 text-sm text-gold underline"
                >
                  {step.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>

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

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl sm:p-6">
          <h2 className="text-lg font-bold text-gold sm:text-xl">
            Payout status
          </h2>
          {stripeError ? (
            <p className="mt-2 text-sm text-red-300">{stripeError}</p>
          ) : null}
          <p className="mt-2 text-sm text-gray-300">
            {stripeLoading
              ? "Checking payout status..."
              : payoutReady
                ? "✅ Ready for payouts."
                : "Payout setup still required before funds can be received."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
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
                {stripeWorking ? "Opening…" : "Finish Stripe Setup"}{" "}
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 shadow-xl sm:p-5">
          <h2 className="text-lg font-bold text-gold">First-sale guidance</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-200">
            <li>
              Add a complete product listing with clear photos and pricing.
            </li>
            <li>Keep at least one listing active and in stock.</li>
            <li>Review listings daily and update weak titles/descriptions.</li>
            <li>Watch your orders page so new purchases are fulfilled fast.</li>
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/marketplace/add-products"
              className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-500"
            >
              Add product
            </Link>
            <Link
              href="/dashboard/seller/products"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              Review listings
            </Link>
            <Link
              href="/marketplace/orders"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              Open orders
            </Link>
          </div>
        </div>

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
      </div>
    </div>
  );
}

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

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-black text-white relative">
      <GlowBackground />
      <div className="relative mx-auto max-w-6xl space-y-5 px-3 py-5 sm:space-y-6 sm:px-4 sm:py-8">
        <div className="h-8 w-2/3 animate-pulse rounded bg-white/10 sm:h-10" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-white/10 sm:h-5" />
      </div>
    </div>
  );
}
