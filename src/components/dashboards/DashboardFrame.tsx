"use client";

import React, { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Menu,
  LogOut,
  Home,
  LayoutDashboard,
  Megaphone,
  Store,
  Briefcase,
  BadgeCheck,
} from "lucide-react";

type AccountType =
  | "user"
  | "business"
  | "seller"
  | "employer"
  | "admin"
  | string;

type MeUser = {
  email: string;
  accountType: AccountType;
  businessName?: string;
  isPremium?: boolean;
  currentPlan?: string;
  premiumStatus?: string;
  premiumActivatedAt?: string | null;
};

type NavItem = {
  label: string;
  href: string;
  icon?: React.ReactNode;
  show?: (t: AccountType) => boolean;
};

function buildNav(accountType: AccountType): NavItem[] {
  const items: NavItem[] = [
    {
      label: "Dashboard Home",
      href: "/dashboard",
      icon: <LayoutDashboard size={18} />,
      show: () => true,
    },
    {
      label: "Directory",
      href: "/business-directory",
      icon: <Home size={18} />,
      show: (t) => t !== "user",
    },

    {
      label: "Find Jobs",
      href: "/job-listings",
      icon: <Briefcase size={18} />,
      show: (t) => t === "user",
    },
    {
      label: "My Applications",
      href: "/applications",
      icon: <Briefcase size={18} />,
      show: (t) => t === "user",
    },
    {
      label: "Saved Jobs",
      href: "/saved-jobs",
      icon: <Briefcase size={18} />,
      show: (t) => t === "user",
    },
    {
      label: "My Profile",
      href: "/profile",
      icon: <LayoutDashboard size={18} />,
      show: (t) => t === "user",
    },

    {
      label: "Manage Ads",
      href: "/advertise-with-us",
      icon: <Megaphone size={18} />,
      show: (t) => t === "business" || t === "admin",
    },

    {
      label: "Seller Dashboard",
      href: "/marketplace/dashboard",
      icon: <Store size={18} />,
      show: (t) => t === "seller" || t === "admin",
    },
    {
      label: "Add Products",
      href: "/marketplace/add-products",
      icon: <Store size={18} />,
      show: (t) => t === "seller" || t === "admin",
    },
    {
      label: "Become a Seller",
      href: "/marketplace/become-a-seller",
      icon: <Store size={18} />,
      show: (t) => t === "business" || t === "employer",
    },

    {
      label: "Manage Jobs",
      href: "/employer/jobs",
      icon: <Briefcase size={18} />,
      show: (t) => t === "employer" || t === "admin",
    },
    {
      label: "Applicants",
      href: "/employer/applicants",
      icon: <Briefcase size={18} />,
      show: (t) => t === "employer" || t === "admin",
    },

    {
      label: "Admin Tools",
      href: "/admin/tools",
      icon: <LayoutDashboard size={18} />,
      show: (t) => t === "admin",
    },
  ];

  return items.filter((i) => (i.show ? i.show(accountType) : true));
}

export default function DashboardFrame({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState<MeUser | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json().catch(() => null);
        const user = data?.user as MeUser | undefined;

        if (!cancelled) {
          setMe(user ?? null);
        }
      } catch {
        if (!cancelled) {
          setMe(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingMe(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onRoute = () => setOpen(false);
    router.events.on("routeChangeComplete", onRoute);
    router.events.on("routeChangeError", onRoute);

    return () => {
      router.events.off("routeChangeComplete", onRoute);
      router.events.off("routeChangeError", onRoute);
    };
  }, [router.events]);

  const accountType = me?.accountType ?? "user";
  const navItems = useMemo(() => buildNav(accountType), [accountType]);

  const isPremiumActive =
    me?.isPremium === true ||
    me?.currentPlan === "premium" ||
    me?.premiumStatus === "active";

  const currentPlanLabel =
    typeof me?.currentPlan === "string" && me.currentPlan.trim()
      ? me.currentPlan.toUpperCase()
      : "FREE";

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      router.replace("/login");
    }
  }

  const pageTitle =
    accountType === "seller"
      ? "Seller Dashboard"
      : accountType === "employer"
        ? "Employer Dashboard"
        : accountType === "user"
          ? "User Dashboard"
          : "BWE Global Dashboard";
  const whoLabel = me?.businessName || me?.email;
  const quickLinks = [
    { label: "Support", href: "/support" },
    { label: "Pricing", href: "/pricing" },
    { label: "Marketplace", href: "/marketplace" },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div
        className={clsx(
          "fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <div className="pointer-events-none fixed inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.22),_transparent_52%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1600px] flex-col md:flex-row">
        <aside
          className={clsx(
            "fixed inset-y-0 left-0 z-40 w-72 border-r border-[#d4af37]/10 bg-[#090909]/95 backdrop-blur-xl transition-transform duration-200",
            open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
            "md:static md:block md:min-h-screen",
          )}
        >
          <div className="border-b border-[#d4af37]/10 px-6 pb-5 pt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-yellow-300 transition hover:text-yellow-200"
            >
              <Home size={18} />
              <span className="font-semibold tracking-tight">
                Black Wealth Exchange
              </span>
            </Link>

            <div className="mt-5 rounded-3xl border border-white/8 bg-white/[0.03] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
              <div className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                Command Center
              </div>
              <div className="mt-2 text-lg font-semibold tracking-tight text-white">
                {pageTitle}
              </div>
              <p className="mt-2 text-sm leading-6 text-white/62">
                Keep your BWE account, access, and next actions in one place.
              </p>
            </div>

            <div className="mt-4 text-xs text-gray-400">
              {loadingMe ? (
                <span>Loading account…</span>
              ) : whoLabel ? (
                <div className="space-y-2">
                  <div>
                    Signed in as{" "}
                    <span className="text-gray-200">{whoLabel}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full border border-yellow-500/25 px-2 py-0.5 text-[10px] text-yellow-200">
                      {String(accountType).toUpperCase()}
                    </span>

                    <span
                      className={clsx(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px]",
                        isPremiumActive
                          ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-200"
                          : "border-white/10 bg-white/5 text-gray-300",
                      )}
                    >
                      {currentPlanLabel}
                    </span>
                  </div>
                </div>
              ) : (
                <span>Not signed in</span>
              )}
            </div>
          </div>

          <nav className="px-3 py-4">
            <div className="mb-3 px-3 text-[11px] uppercase tracking-[0.22em] text-white/35">
              Workspace
            </div>
            <ul className="space-y-1.5">
              {navItems.map((item) => {
                const active =
                  router.asPath === item.href ||
                  (item.href !== "/dashboard" &&
                    router.asPath.startsWith(item.href));

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={clsx(
                        "flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm transition",
                        active
                          ? "border-[#d4af37]/25 bg-[#d4af37]/10 text-yellow-100 shadow-[0_16px_40px_rgba(212,175,55,0.08)]"
                          : "border-transparent text-gray-200 hover:border-white/10 hover:bg-white/[0.04] hover:text-white",
                      )}
                    >
                      <span className="opacity-90">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-6 px-3">
              {isPremiumActive ? (
                <div className="rounded-3xl border border-yellow-500/25 bg-yellow-500/10 px-4 py-4">
                  <div className="flex items-center justify-center gap-2 text-sm font-semibold text-yellow-200">
                    <BadgeCheck size={16} />
                    Premium Active
                  </div>
                  <p className="mt-1 text-center text-[11px] text-gray-300">
                    Your Premium membership is active.
                  </p>
                  <Link
                    href="/pricing"
                    className="mt-3 block rounded-full border border-yellow-500/20 bg-black/30 px-4 py-2 text-center text-sm font-semibold text-yellow-200 transition hover:bg-yellow-500/10"
                  >
                    View Plan
                  </Link>
                </div>
              ) : (
                <Link
                  href="/pricing"
                  className="block rounded-full bg-yellow-400 px-4 py-2 text-center font-semibold text-black transition hover:bg-yellow-300"
                >
                  Upgrade to Premium
                </Link>
              )}
            </div>

            <div className="mt-6 px-3">
              <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                <div className="text-[11px] uppercase tracking-[0.22em] text-white/35">
                  Quick links
                </div>
                <div className="mt-3 space-y-2">
                  {quickLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block rounded-2xl border border-white/8 px-3 py-2 text-sm text-white/72 transition hover:border-[#d4af37]/20 hover:bg-[#d4af37]/8 hover:text-white"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="mx-3 mt-5 flex w-[calc(100%-1.5rem)] items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300 transition hover:bg-red-500/15 hover:text-red-200"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </nav>
        </aside>

        <main className="flex-1 min-w-0 overflow-y-auto px-4 py-6 md:px-8 lg:px-10">
          <header className="mb-6 rounded-[2rem] border border-white/8 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-5 py-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <button
                  aria-label="Toggle navigation"
                  onClick={() => setOpen((v) => !v)}
                  className="mt-1 rounded-xl border border-white/10 bg-white/[0.04] p-2 md:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-400"
                >
                  <Menu size={20} />
                </button>

                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                    Experience 2.0
                  </div>
                  <div className="relative mt-2">
                    <div className="pointer-events-none absolute -top-8 left-0 h-24 w-72 rounded-full bg-yellow-400 opacity-20 blur-3xl" />
                    <h1 className="relative text-2xl font-bold tracking-tight md:text-4xl">
                      {pageTitle}
                    </h1>
                  </div>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/62 md:text-base">
                    Move through account actions, access checks, and platform
                    tools without losing the working business logic underneath.
                  </p>
                </div>
              </div>

              <div className="hidden shrink-0 md:block">
                <Link
                  href="/"
                  className="inline-flex items-center rounded-full border border-[#d4af37]/25 bg-[#d4af37]/10 px-4 py-2 text-sm font-semibold text-yellow-100 transition hover:bg-[#d4af37]/16"
                >
                  Back to BWE home
                </Link>
              </div>
            </div>
          </header>

          {children}
        </main>
      </div>
    </div>
  );
}
