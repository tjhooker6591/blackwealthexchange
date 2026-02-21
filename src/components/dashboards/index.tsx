// src/components/dashboards/index.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import BusinessDashboard from "./BusinessDashboard";

type AccountType =
  | "user"
  | "business"
  | "seller"
  | "employer"
  | "admin"
  | string;

/**
 * ✅ Local shared type (keeps this wrapper independent of other files' exports)
 * Flexible so dashboards can evolve without breaking the build.
 */
export type DashboardUser = {
  _id?: string;
  id?: string;
  email?: string;
  accountType?: AccountType;
  businessName?: string;
  name?: string;
  [key: string]: any;
};

const SHARED_DASHBOARD_TYPES: AccountType[] = [
  "business",
  "seller",
  "employer",
  "admin",
];

/**
 * ✅ Fix: BusinessDashboard currently doesn't expose prop types (or is typed as no-props).
 * We cast it here so TS allows passing `user` without forcing changes in BusinessDashboard.tsx.
 * Runtime is fine either way (React will pass props; component can ignore them).
 */
const BusinessDashboardWithUser =
  BusinessDashboard as unknown as React.ComponentType<{ user: DashboardUser }>;

function GlowBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 opacity-60">
      <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-yellow-500/10 blur-3xl" />
      <div className="absolute top-[38%] left-[12%] h-[320px] w-[320px] rounded-full bg-yellow-500/5 blur-3xl" />
    </div>
  );
}

function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white relative">
      <GlowBackground />
      <div className="relative max-w-6xl mx-auto p-6 space-y-8">
        {/* Top bar */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gold tracking-tight">
              {title}
            </h1>
            {subtitle ? <p className="text-gray-300 mt-1">{subtitle}</p> : null}
          </div>

          <div className="flex gap-3">
            <Link
              href="/"
              className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm"
            >
              Home
            </Link>
            <Link
              href="/marketplace"
              className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm"
            >
              Marketplace
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">{children}</div>
      </div>
    </div>
  );
}

function LoadingShell() {
  return (
    <div className="min-h-screen bg-black text-white relative flex items-center justify-center p-6">
      <GlowBackground />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
        <div className="h-6 w-2/3 bg-white/10 rounded animate-pulse" />
        <div className="mt-3 h-4 w-1/2 bg-white/10 rounded animate-pulse" />
        <div className="mt-6 h-10 w-full bg-white/10 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}

function UnknownRole({
  accountType,
  onHome,
  onLogin,
}: {
  accountType: string | null;
  onHome: () => void;
  onLogin: () => void;
}) {
  return (
    <PageShell
      title="Dashboard unavailable"
      subtitle="Your account role is not recognized."
    >
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 shadow-xl">
        <p className="text-gray-200">
          Unknown account type:{" "}
          <code className="text-red-100">{String(accountType)}</code>
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onHome}
            className="px-5 py-2 rounded-xl bg-gold text-black font-semibold hover:bg-yellow-500 transition"
          >
            Back to Home
          </button>
          <button
            onClick={onLogin}
            className="px-5 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
          >
            Log in again
          </button>
        </div>
      </div>
    </PageShell>
  );
}

export default function DashboardWrapper() {
  const router = useRouter();
  const [me, setMe] = useState<DashboardUser | null>(null);
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
          signal: controller.signal,
        });

        if (!res.ok) {
          setRedirecting(true);
          router.replace("/login?redirect=/dashboard");
          return;
        }

        const data = await res.json().catch(() => null);
        const user = (data?.user ?? null) as DashboardUser | null;
        const role = (user?.accountType ?? null) as AccountType | null;

        if (!role) {
          setRedirecting(true);
          router.replace("/login?redirect=/dashboard");
          return;
        }

        // ✅ Rule: general users do NOT get a dashboard
        if (role === "user") {
          setRedirecting(true);
          router.replace("/");
          return;
        }

        setMe(user);
        setAccountType(role);
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          console.error(e);
          setRedirecting(true);
          router.replace("/login?redirect=/dashboard");
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [router]);

  const title = useMemo(() => {
    if (!accountType) return "Dashboard";
    if (accountType === "seller") return "Seller Dashboard";
    if (accountType === "employer") return "Employer Dashboard";
    if (accountType === "business") return "Business Dashboard";
    if (accountType === "admin") return "Admin Dashboard";
    return "Dashboard";
  }, [accountType]);

  const subtitle = useMemo(() => {
    if (!accountType) return undefined;
    if (accountType === "seller")
      return "Manage products, orders, and payouts.";
    if (accountType === "employer") return "Post jobs and review applicants.";
    if (accountType === "business")
      return "Manage your business profile and promotions.";
    if (accountType === "admin")
      return "Manage platform operations and approvals.";
    return undefined;
  }, [accountType]);

  if (loading) return <LoadingShell />;
  if (redirecting) return null;

  // ✅ Shared dashboard UI for business/seller/employer/admin
  if (me && accountType && SHARED_DASHBOARD_TYPES.includes(accountType)) {
    return (
      <PageShell title={title} subtitle={subtitle}>
        <BusinessDashboardWithUser user={me} />
      </PageShell>
    );
  }

  return (
    <UnknownRole
      accountType={accountType}
      onHome={() => router.replace("/")}
      onLogin={() => router.replace("/login?redirect=/dashboard")}
    />
  );
}
