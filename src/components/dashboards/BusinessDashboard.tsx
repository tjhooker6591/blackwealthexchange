"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
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
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (!data?.user || data.user.accountType !== "business") {
          router.push("/login?redirect=/dashboard");
          return;
        }

        setUser(data.user);
      } catch (error) {
        console.error("Failed to fetch user:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading business dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-5xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-gold mb-4">Welcome, {user?.businessName || user?.email}</h2>

        <p className="text-gray-300 mb-6">
          Manage your business profile, run ads, and grow your visibility across the platform.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <DashboardCard
            title="Edit Business Profile"
            description="Update your business info, contact details, and description."
            href="/edit-business"
            color="bg-blue-700"
          />
          <DashboardCard
            title="Advertise With Us"
            description="Launch an ad campaign to boost visibility and get featured."
            href="/advertise"
            color="bg-yellow-500 text-black"
          />
          <DashboardCard
            title="View Sponsored Directory"
            description="See where your business appears and how others are featured."
            href="/business-directory/sponsored-business"
            color="bg-green-700"
          />
          <DashboardCard
            title="Upgrade to Seller"
            description="Start listing products in the marketplace as a verified seller."
            href="/marketplace/become-a-seller"
            color="bg-purple-700"
          />
        </div>
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

