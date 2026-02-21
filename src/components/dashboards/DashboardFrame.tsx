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
      show: (t) => t !== "user",
    },
    {
      label: "Directory",
      href: "/business-directory",
      icon: <Home size={18} />,
      show: (t) => t !== "user",
    },

    // Business / Admin
    {
      label: "Manage Ads",
      href: "/dashboard/business/ads",
      icon: <Megaphone size={18} />,
      show: (t) => t === "business" || t === "admin",
    },

    // Seller / Admin
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

    // Employer / Admin
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

    // Admin (optional links you can expand)
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

  // Fetch who is logged in (so nav can adapt)
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

        if (!cancelled) setMe(user ?? null);
      } catch {
        if (!cancelled) setMe(null);
      } finally {
        if (!cancelled) setLoadingMe(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Close drawer whenever route changes (mobile UX)
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

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      // Send them somewhere clean after logout
      router.replace("/login");
    }
  }

  const pageTitle = "BWE Global Dashboard";
  const whoLabel = me?.businessName || me?.email;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row">
      {/* Mobile overlay */}
      <div
        className={clsx(
          "fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar / Drawer */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 w-72 bg-neutral-950 border-r border-yellow-500/10 transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          "md:static md:block",
        )}
      >
        {/* Brand / top */}
        <div className="px-6 pt-6 pb-4 border-b border-yellow-500/10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-yellow-300 hover:text-yellow-200"
          >
            <Home size={18} />
            <span className="font-semibold tracking-tight">
              Black Wealth Exchange
            </span>
          </Link>

          <div className="mt-3 text-xs text-gray-400">
            {loadingMe ? (
              <span>Loading account…</span>
            ) : whoLabel ? (
              <span>
                Signed in as <span className="text-gray-200">{whoLabel}</span>{" "}
                <span className="ml-2 inline-flex items-center rounded-full border border-yellow-500/25 px-2 py-0.5 text-[10px] text-yellow-200">
                  {String(accountType).toUpperCase()}
                </span>
              </span>
            ) : (
              <span>Not signed in</span>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="px-3 py-4">
          <ul className="space-y-1">
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
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                      active
                        ? "bg-yellow-500/10 text-yellow-200 border border-yellow-500/20"
                        : "text-gray-200 hover:bg-neutral-900/60 hover:text-white",
                    )}
                  >
                    <span className="opacity-90">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Upgrade CTA (hide for admin if you want) */}
          <div className="mt-5 px-3">
            <Link
              href="/pricing"
              className="block rounded-full bg-yellow-400 px-4 py-2 text-center font-semibold text-black hover:bg-yellow-300 transition"
            >
              Upgrade to Premium
            </Link>
          </div>

          {/* Sign out */}
          <button
            onClick={handleLogout}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-300 hover:bg-red-500/15 hover:text-red-200 transition"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-y-auto px-4 py-6 md:px-10">
        <header className="flex items-center justify-between mb-6">
          {/* burger only on phones */}
          <button
            aria-label="Toggle navigation"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden rounded p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-400"
          >
            <Menu size={24} />
          </button>

          <div className="relative">
            {/* subtle gold hue behind title */}
            <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 h-24 w-72 rounded-full blur-3xl opacity-25 bg-yellow-400" />
            <h1 className="relative text-xl font-bold md:text-3xl">
              {pageTitle}
            </h1>
          </div>

          {/* spacer so header stays balanced on mobile */}
          <div className="w-10 md:hidden" />
        </header>

        {children}
      </main>
    </div>
  );
}
