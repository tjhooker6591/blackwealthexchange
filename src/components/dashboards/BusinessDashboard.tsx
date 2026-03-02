// src/components/dashboards/BusinessDashboard.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import {
  Briefcase,
  Megaphone,
  Store,
  ShoppingBag,
  ShieldCheck,
  ArrowRight,
  Building2,
  Lock,
  AlertTriangle,
  UserCircle2,
} from "lucide-react";

type AccountType =
  | "user"
  | "business"
  | "seller"
  | "employer"
  | "admin"
  | string;

export type DashboardUser = {
  email?: string;
  accountType?: AccountType;
  businessName?: string;
  fullName?: string;
  businessAddress?: string;
  businessPhone?: string;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function BusinessDashboard({
  user: initialUser,
}: {
  user?: DashboardUser | null;
}) {
  const router = useRouter();

  const [user, setUser] = useState<DashboardUser | null>(initialUser ?? null);
  const [loading, setLoading] = useState(!initialUser);
  const [accessDenied, setAccessDenied] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    if (initialUser) return;

    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setAccessDenied(false);
        setDataError(null);

        const res = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
          signal: controller.signal,
        });

        if (!res.ok) {
          setAccessDenied(true);
          return;
        }

        const data = await res.json();
        const u = data?.user;

        if (
          !u ||
          !["business", "seller", "employer", "admin"].includes(
            String(u.accountType || ""),
          )
        ) {
          setAccessDenied(true);
          return;
        }

        setUser(u);
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        console.error("Failed to load business dashboard:", err);
        setDataError(
          "We had trouble loading your dashboard. Please refresh and try again.",
        );
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [initialUser]);

  const t = String(user?.accountType || "");

  const showAds = t === "business" || t === "admin";
  const isSeller = t === "seller" || t === "admin";
  const isEmployer = t === "employer" || t === "admin";
  const isAdmin = t === "admin";

  const displayName = useMemo(() => {
    return (
      user?.businessName || user?.fullName || user?.email || "Business Account"
    );
  }, [user?.businessName, user?.fullName, user?.email]);

  if (loading) {
    return <BusinessDashboardSkeleton />;
  }

  if (accessDenied) {
    return (
      <div className="min-h-[calc(100vh-80px)] overflow-x-hidden bg-black text-white">
        <div className="mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-8">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/30">
                <Lock className="h-5 w-5 text-yellow-300" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-extrabold text-yellow-300 sm:text-xl">
                  Access Denied
                </h2>
                <p className="mt-1 text-sm text-gray-300">
                  Please log in with a business, seller, employer, or admin
                  account to view this dashboard.
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={() => router.push("/login")}
                    className="w-full rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-yellow-500 sm:w-auto"
                  >
                    Log In
                  </button>
                  <Link
                    href="/business-directory"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-center text-sm transition hover:bg-white/10 sm:w-auto"
                  >
                    View Directory
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-80px)] overflow-x-hidden bg-black text-white">
        <div className="mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-8">
          <div className="rounded-2xl border border-yellow-500/25 bg-yellow-500/10 p-4 shadow-xl sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-yellow-500/20 bg-black/30">
                <AlertTriangle className="h-5 w-5 text-yellow-300" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-extrabold text-yellow-300 sm:text-xl">
                  Dashboard data could not be loaded
                </h2>
                <p className="mt-1 text-sm text-gray-300">
                  Please refresh the page and try again.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] overflow-x-hidden bg-black text-white">
      <div className="mx-auto max-w-6xl space-y-5 px-3 py-4 sm:space-y-8 sm:px-4 sm:py-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl sm:p-6">
          <div className="pointer-events-none absolute -top-16 left-1/2 h-40 w-80 -translate-x-1/2 rounded-full bg-yellow-400/10 blur-3xl" />

          <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-[11px] font-semibold text-yellow-300">
                <Building2 className="h-3.5 w-3.5" />
                Business Workspace
              </div>

              <h1 className="mt-3 text-lg font-extrabold tracking-tight text-white sm:text-2xl md:text-3xl">
                Welcome,{" "}
                <span className="break-words text-yellow-300">
                  {displayName}
                </span>
              </h1>

              <p className="mt-1 text-xs text-gray-300 sm:text-sm md:text-base">
                Manage your profile, visibility, listings, and growth tools
                across the platform.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex w-fit shrink-0 items-center rounded-full border border-yellow-500/25 bg-yellow-500/10 px-3 py-1 text-[11px] font-semibold text-yellow-200">
                {String(t || "business").toUpperCase()}
              </span>

              <Link
                href="/profile"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10"
              >
                <UserCircle2 className="h-4 w-4 text-yellow-300" />
                Profile
              </Link>
            </div>
          </div>
        </div>

        {/* Data warning */}
        {dataError ? (
          <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 shadow-xl sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-yellow-500/20 bg-black/30">
                <AlertTriangle className="h-5 w-5 text-yellow-300" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-yellow-200">Notice</p>
                <p className="mt-1 break-words text-sm text-gray-200">
                  {dataError}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Quick cards */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          <DashboardCard
            title="Edit Business Profile"
            description="Update your business info, contact details, and description."
            href="/dashboard/edit-business"
            variant="default"
            icon={<Briefcase className="h-5 w-5 text-yellow-300" />}
          />

          {showAds && (
            <DashboardCard
              title="Advertise With Us"
              description="Launch an ad campaign to boost visibility and get featured."
              href="/advertise-with-us"
              variant="gold"
              icon={<Megaphone className="h-5 w-5 text-black" />}
            />
          )}

          <DashboardCard
            title="Directory Listings"
            description="See where your business appears and search the full directory."
            href="/business-directory"
            variant="default"
            icon={<Store className="h-5 w-5 text-yellow-300" />}
          />

          {!isSeller ? (
            <DashboardCard
              title="Upgrade to Seller"
              description="Start listing products in the marketplace as a verified seller."
              href="/marketplace/become-a-seller"
              variant="default"
              icon={<ShoppingBag className="h-5 w-5 text-yellow-300" />}
            />
          ) : (
            <DashboardCard
              title="Seller Dashboard"
              description="Add, edit, and manage your marketplace listings."
              href="/marketplace/dashboard"
              variant="default"
              icon={<ShoppingBag className="h-5 w-5 text-yellow-300" />}
            />
          )}

          {isEmployer && (
            <DashboardCard
              title="Employer Tools"
              description="Post jobs, manage listings, and review applicants."
              href="/employer/jobs"
              variant="default"
              icon={<Briefcase className="h-5 w-5 text-yellow-300" />}
            />
          )}

          {isAdmin && (
            <DashboardCard
              title="Admin Tools"
              description="Manage approvals, tools, and platform operations."
              href="/admin/tools"
              variant="default"
              icon={<ShieldCheck className="h-5 w-5 text-yellow-300" />}
            />
          )}
        </div>

        {/* Business details */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-extrabold text-yellow-300 sm:text-xl">
                Business Details
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Your primary contact and business information.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <InfoPill label="Email" value={user.email || "—"} />
            <InfoPill label="Phone" value={user.businessPhone || "—"} />
            <InfoPill label="Address" value={user.businessAddress || "—"} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  description,
  href,
  variant,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  variant: "default" | "gold";
  icon: React.ReactNode;
}) {
  const base =
    "block h-full rounded-2xl p-4 shadow-xl transition hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/60 sm:p-5";

  const styles =
    variant === "gold"
      ? "border border-yellow-300 bg-yellow-500/90 text-black hover:bg-yellow-400"
      : "border border-yellow-500/20 bg-gray-950/70 text-white hover:border-yellow-400/35 hover:bg-gray-950/90";

  return (
    <Link href={href} className={cx(base, styles)}>
      <div className="flex items-start gap-3">
        <div
          className={cx(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
            variant === "gold"
              ? "border-black/10 bg-black/10"
              : "border-white/10 bg-black/30",
          )}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <h3 className="text-sm font-extrabold leading-tight sm:text-lg">
            {title}
          </h3>
          <p
            className={cx(
              "mt-1 text-xs sm:text-sm",
              variant === "gold" ? "text-black/80" : "text-gray-200/90",
            )}
          >
            {description}
          </p>
        </div>
      </div>

      <div
        className={cx(
          "mt-4 inline-flex items-center gap-2 text-sm font-semibold",
          variant === "gold" ? "text-black" : "text-yellow-300",
        )}
      >
        Open <ArrowRight className="h-4 w-4" />
      </div>
    </Link>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-yellow-500/15 bg-black/30 px-4 py-3">
      <div className="text-xs text-gray-400">{label}</div>
      <div className="mt-0.5 break-words text-sm text-gray-200">{value}</div>
    </div>
  );
}

function BusinessDashboardSkeleton() {
  return (
    <div className="min-h-[calc(100vh-80px)] overflow-x-hidden bg-black text-white">
      <div className="mx-auto max-w-6xl space-y-5 px-3 py-4 sm:space-y-8 sm:px-4 sm:py-8">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl sm:p-6">
          <div className="h-4 w-28 animate-pulse rounded bg-white/10" />
          <div className="mt-4 h-7 w-1/2 animate-pulse rounded bg-white/10 sm:h-8" />
          <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-white/10" />
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl sm:p-5"
            >
              <div className="h-10 w-10 animate-pulse rounded-xl bg-white/10" />
              <div className="mt-4 h-5 w-2/3 animate-pulse rounded bg-white/10" />
              <div className="mt-2 h-4 w-full animate-pulse rounded bg-white/10" />
              <div className="mt-1 h-4 w-4/5 animate-pulse rounded bg-white/10" />
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl sm:p-6">
          <div className="h-6 w-1/3 animate-pulse rounded bg-white/10" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3"
              >
                <div className="h-3 w-12 animate-pulse rounded bg-white/10" />
                <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
