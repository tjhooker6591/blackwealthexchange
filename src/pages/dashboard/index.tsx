"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import SellerDashboard from "@/components/dashboards/SellerDashboard";
import EmployerDashboard from "@/components/dashboards/EmployerDashboard";
import BusinessDashboard from "@/components/dashboards/BusinessDashboard";
import UserDashboard from "@/components/dashboards/UserDashboard";

export default function DashboardPage() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user session info (adjust path if you use a custom API)
    const fetchSession = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (!data || !data.user) {
          router.push("/login?redirect=/dashboard");
          return;
        }

        setAccountType(data.user.accountType);
      } catch (error) {
        console.error("Session fetch failed:", error);
        router.push("/login?redirect=/dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p className="text-lg">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold text-gold mb-4">
        BWE Global Dashboard
      </h1>

      <div className="mb-6 text-sm text-gray-300">
        This dashboard is tailored to your role:{" "}
        <strong className="text-white">{accountType}</strong>
      </div>

      {/* Dynamic Role-Based Rendering */}
      {accountType === "seller" && <SellerDashboard />}
      {accountType === "business" && <BusinessDashboard />}
      {accountType === "employer" && <EmployerDashboard />}
      {accountType === "user" && <UserDashboard />}
    </div>
  );
}
