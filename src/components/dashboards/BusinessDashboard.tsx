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
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        // Instead of redirecting, mark access as denied if accountType isn't "business"
        if (!data?.user || data.user.accountType !== "business") {
          setAccessDenied(true);
          return;
        }

        setUser(data.user);
      } catch (error) {
        console.error("Failed to fetch user:", error);
        setAccessDenied(true);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Loading Business Dashboard...</p>
      </div>
    );
  }

  if (accessDenied || !user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Access Denied. You do not have permission to view this dashboard.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Business Dashboard</h1>
          <nav>
            <Link href="/dashboard">
              <span className="mr-4 hover:underline">Dashboard Home</span>
            </Link>
            <Link href="/profile">
              <span className="hover:underline">Profile</span>
            </Link>
          </nav>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-gray-800 text-white p-4">
          <nav>
            <ul className="space-y-4">
              <li>
                <Link href="/dashboard/business/overview">
                  <a className="hover:underline">Overview</a>
                </Link>
              </li>
              <li>
                <Link href="/dashboard/business/ads">
                  <a className="hover:underline">Manage Ads</a>
                </Link>
              </li>
              <li>
                <Link href="/dashboard/business/directory">
                  <a className="hover:underline">Sponsored Directory</a>
                </Link>
              </li>
              <li>
                <Link href="/dashboard/business/upgrade">
                  <a className="hover:underline">Upgrade Options</a>
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content Area */}
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
                href="/edit-business"
                color="bg-blue-700"
              />
              <DashboardCard
                title="🚀 Advertise With Us"
                description="Launch an ad campaign to boost visibility and get featured."
                href="/advertise"
                color="bg-yellow-500 text-black"
              />
              <DashboardCard
                title="⭐ View Sponsored Directory"
                description="See where your business appears and how others are featured."
                href="/business-directory/sponsored-business"
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
    <Link href={href}>
      <div
        className={`rounded-lg p-5 shadow-md hover:shadow-xl transition cursor-pointer ${color}`}
      >
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-sm">{description}</p>
      </div>
    </Link>
  );
}
