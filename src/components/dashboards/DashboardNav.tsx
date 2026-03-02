// src/components/dashboards/DashboardNav.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import clsx from "clsx";
import {
  BarChart3,
  User,
  Settings,
  Megaphone,
  Store,
  Briefcase,
  Wrench,
  Home,
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
};

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  show?: (t: AccountType) => boolean;
};

function buildNav(t: AccountType): NavItem[] {
  const items: NavItem[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <BarChart3 size={18} />,
      show: (x) => x !== "user",
    },
    {
      label: "Directory",
      href: "/business-directory",
      icon: <Home size={18} />,
      show: (x) => x !== "user",
    },

    // Business ads
    {
      label: "Manage Ads",
      href: "/dashboard/business/ads",
      icon: <Megaphone size={18} />,
      show: (x) => x === "business" || x === "admin",
    },

    // Marketplace seller tools
    {
      label: "Seller Dashboard",
      href: "/marketplace/dashboard",
      icon: <Store size={18} />,
      show: (x) => x === "seller" || x === "admin",
    },
    {
      label: "Become a Seller",
      href: "/marketplace/become-a-seller",
      icon: <BadgeCheck size={18} />,
      show: (x) => x === "business" || x === "employer",
    },

    // Employer tools
    {
      label: "Jobs",
      href: "/employer/jobs",
      icon: <Briefcase size={18} />,
      show: (x) => x === "employer" || x === "admin",
    },
    {
      label: "Applicants",
      href: "/employer/applicants",
      icon: <Briefcase size={18} />,
      show: (x) => x === "employer" || x === "admin",
    },

    // Shared
    {
      label: "Profile",
      href: "/profile",
      icon: <User size={18} />,
      show: () => true,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: <Settings size={18} />,
      show: () => true,
    },

    // Admin
    {
      label: "Admin Tools",
      href: "/admin/tools",
      icon: <Wrench size={18} />,
      show: (x) => x === "admin",
    },
  ];

  return items.filter((i) => (i.show ? i.show(t) : true));
}

export default function DashboardNav({
  accountType,
}: {
  accountType?: AccountType;
}) {
  const router = useRouter();
  const [me, setMe] = useState<MeUser | null>(null);

  // If accountType is not provided, fetch it.
  useEffect(() => {
    let cancelled = false;
    if (accountType) return;

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
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accountType]);

  const t = accountType ?? me?.accountType ?? "user";

  const items = useMemo(() => buildNav(t), [t]);

  return (
    <nav className="p-4 md:p-6 space-y-1">
      {items.map((item) => {
        const active =
          router.asPath === item.href ||
          (item.href !== "/dashboard" && router.asPath.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
              active
                ? "bg-yellow-500/10 text-yellow-200 border border-yellow-500/20"
                : "text-gray-200 hover:bg-neutral-900/60 hover:text-yellow-100",
            )}
          >
            <span className="opacity-90">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
