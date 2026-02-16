"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

type AccountType = "user" | "business" | "seller" | "employer" | "admin" | string;

type BusinessUser = {
  email: string;
  accountType: AccountType;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
};

const ALLOWED_DASHBOARD_TYPES: AccountType[] = ["business", "seller", "employer", "admin"];

export default function BusinessDashboard() {
  const router = useRouter();

  const [user, setUser] = useState<BusinessUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json().catch(() => null);
        const me = data?.user as BusinessUser | undefined;

        if (!res.ok || !me?.accountType) {
          if (!cancelled) setAccessDenied(true);
          return;
        }

        // Rule: general users should NOT see a dashboard
        if (me.accountType === "user") {
          if (!cancelled) router.replace("/");
          return;
        }

        // Shared dashboard for business/seller/employer (+ optional admin)
        if (!ALLOWED_DASHBOARD_TYPES.includes(me.accountType)) {
          if (!cancelled) setAccessDenied(true);
          return;
        }

        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) setAccessDenied(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const sidebarLinks = useMemo(() => {
    if (!user) return [];

    const common = [
      { href: "/dashboard/business/overview", label: "Overview" },
      { href: "/business-directory", label: "Directory" },
    ];

    const businessAds =
      user.accountType === "business" || user.accountType === "admin"
        ? [{ href: "/dashboard/business/ads", label: "Manage Ads" }]
        : [];

    const sellerTools =
      user.accountType === "seller" || user.accountType === "admin"
        ? [
            { href: "/marketplace/dashboard", label: "Seller Dashboard" },
            { href: "/marketplace/add-products", label: "Add Products" },
          ]
        : [{ href: "/marketplace/become-a-seller", label: "Upgrade to Seller" }];

    const employerTools =
      user.accountType === "employer" || user.accountType === "admin"
        ? [
            { href: "/employer/jobs", label: "Manage Jobs" },
            { href: "/employer/applicants", label: "View Applicants" },
          ]
        : [];

    const upgrade = [{ href: "/dashboard/business/upgrade", label: "Upgrade Options" }];

    return [...common, ...businessAds, ...sellerTools, ...employerTools, ...upgrade];
  }, [user]);

  const quickActions = useMemo(() => {
    if (!user) return [];

    const actions: Array<{
      title: string;
      description: string;
      href: string;
      className: string;
    }> = [
      {
        title: "📝 Edit Business Profile",
        description: "Update your business info, contact details, and description.",
        href: "/dashboard/edit-business",
        className: "bg-gray-900 border border-yellow-500/25 hover:border-yellow-400/40",
      },
      {
        title: "⭐ View Directory Listings",
        description: "See where your business appears and search the full directory.",
        href: "/business-directory",
        className: "bg-gray-900 border border-yellow-500/25 hover:border-yellow-400/40",
      },
    ];

    if (user.accountType === "business" || user.accountType === "admin") {
      actions.unshift({
        title: "🚀 Advertise With Us",
        description: "Launch an ad campaign to boost visibility and get featured.",
        href: "/advertise-with-us",
        className:
          "bg-yellow-500/90 text-black border border-yellow-300 hover:bg-yellow-400",
      });
    }

    if (user.accountType === "seller" || user.accountType === "admin") {
      actions.push({
        title: "🛍️ Manage Products",
        description: "Add, edit, and manage your marketplace listings.",
        href: "/marketplace/dashboard",
        className: "bg-gray-900 border border-yellow-500/25 hover:border-yellow-400/40",
      });
    } else {
      actions.push({
        title: "🛍️ Upgrade to Seller",
        description: "Start listing products in the marketplace as a verified seller.",
        href: "/marketplace/become-a-seller",
        className: "bg-gray-900 border border-yellow-500/25 hover:border-yellow-400/40",
      });
    }

    if (user.accountType === "employer" || user.accountType === "admin") {
      actions.push({
        title: "💼 Employer Tools",
        description: "Post jobs, manage listings, and review applicants.",
        href: "/employer/jobs",
        className: "bg-gray-900 border border-yellow-500/25 hover:border-yellow-400/40",
      });
    }

    return actions;
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading Dashboard…
      </div>
    );
  }

  if (accessDenied || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Access Denied. You do not have permission to view this dashboard.
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* Header */}
      <header className="bg-gray-950/80 border-b border-yellow-500/15 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Business Dashboard</h1>
            <p className="text-xs text-gray-400">
              Signed in as <span className="text-gray-200">{user.email}</span>{" "}
              <span className="ml-2 inline-flex items-center rounded-full border border-yellow-500/25 px-2 py-0.5 text-[10px] text-yellow-200">
                {String(user.accountType).toUpperCase()}
              </span>
            </p>
          </div>

          <nav className="space-x-4 text-sm">
            <Link href="/dashboard" className="hover:underline">
              Dashboard Home
            </Link>
            <Link href="/profile" className="hover:underline">
              Profile
            </Link>
          </nav>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-950/60 border-r border-yellow-500/10 text-white p-4">
          <nav>
            <ul className="space-y-3">
              {sidebarLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="block rounded-md px-3 py-2 text-sm text-gray-200 hover:bg-gray-900/60 hover:text-white transition"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 p-6">
          {/* subtle light-gold “hue” */}
          <div className="max-w-5xl mx-auto relative">
            <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full blur-3xl opacity-30 bg-yellow-400" />
            <div className="relative bg-gray-900/60 border border-yellow-500/15 p-6 rounded-2xl shadow-xl">
              <h2 className="text-3xl font-bold text-yellow-300 mb-2">
                Welcome, {user.businessName || user.email}
              </h2>
              <p className="text-gray-300 mb-6">
                Manage your profile, visibility, and tools across the platform.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                {quickActions.map((a) => (
                  <DashboardCard
                    key={a.href}
                    title={a.title}
                    description={a.description}
                    href={a.href}
                    className={a.className}
                  />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  description,
  href,
  className,
}: {
  title: string;
  description: string;
  href: string;
  className: string;
}) {
  return (
    <Link
      href={href}
      className={[
        "block rounded-xl p-5 shadow-md hover:shadow-2xl transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/60",
        className,
      ].join(" ")}
    >
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-sm opacity-90">{description}</p>
    </Link>
  );
}
