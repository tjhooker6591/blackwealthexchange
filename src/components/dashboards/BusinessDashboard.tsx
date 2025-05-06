// src/components/dashboards/BusinessDashboard.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type BusinessUser = {
  email: string;
  accountType: string;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
};

export default function BusinessDashboard() {
  const [user, setUser] = useState<BusinessUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (!data?.user || data.user.accountType !== "business") {
          setAccessDenied(true);
          return;
        }
        setUser(data.user);
      } catch {
        setAccessDenied(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading Business Dashboard…
      </div>
    );
  }
  if (accessDenied || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Access Denied. You do not have permission to view this dashboard.
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Business Dashboard</h1>
          <nav className="space-x-4">
            <Link href="/dashboard" className="hover:underline">
              Dashboard Home
            </Link>
            <Link href="/profile" className="hover:underline">
              Profile
            </Link>
          </nav>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-800 text-white p-4">
          <nav>
            <ul className="space-y-4">
              <li>
                <Link
                  href="/dashboard/business/overview"
                  className="hover:underline"
                >
                  Overview
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/business/ads"
                  className="hover:underline"
                >
                  Manage Ads
                </Link>
              </li>
              <li>
                <Link
                  href="/business-directory"
                  className="hover:underline"
                >
                  Sponsored Directory
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/business/upgrade"
                  className="hover:underline"
                >
                  Upgrade Options
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 p-6 bg-black text-white">
          <div className="max-w-5xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-3xl font-bold text-gold mb-4">
              Welcome, {user.businessName || user.email}
            </h2>
            <p className="text-gray-300 mb-6">
              Manage your business profile, run ads, and grow your visibility
              across the platform.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <DashboardCard
                title="📝 Edit Business Profile"
                description="Update your business info, contact details, and description."
                href="/dashboard/edit-business"
                color="bg-blue-700"
              />
              <DashboardCard
                title="🚀 Advertise With Us"
                description="Launch an ad campaign to boost visibility and get featured."
                href="/advertise"
                color="bg-yellow-500 text-black"
              />
              <DashboardCard
                title="⭐ View Directory Listings"
                description="See where your business appears and search the full directory."
                href="/business-directory"
                color="bg-green-700"
              />
              <DashboardCard
                title="🛍️ Upgrade to Seller"
                description="Start listing products in the marketplace as a verified seller."
                href="/marketplace/become-a-seller"
                color="bg-purple-700"
              />
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
  color,
}: {
  title: string;
  description: string;
  href: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-lg p-5 shadow-md hover:shadow-xl transition cursor-pointer ${color}`}
    >
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-sm">{description}</p>
    </Link>
  );
}
