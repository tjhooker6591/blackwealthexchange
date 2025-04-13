// src/components/dashboards/index.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import SellerDashboard from "./SellerDashboard";
import EmployerDashboard from "./EmployerDashboard";
import BusinessDashboard from "./BusinessDashboard";
import UserDashboard from "./UserDashboard";

export default function DashboardWrapper() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (!data?.user) {
          router.push("/login?redirect=/dashboard");
          return;
        }

        setAccountType(data.user.accountType);
      } catch (error) {
        console.error("Failed to fetch session:", error);
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
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold text-gold mb-4">
        BWE Global Dashboard
      </h1>
      {accountType === "seller" && <SellerDashboard />}
      {accountType === "business" && <BusinessDashboard />}
      {accountType === "employer" && <EmployerDashboard />}
      {accountType === "user" && <UserDashboard />}
      {!["seller", "business", "employer", "user"].includes(
        accountType || "",
      ) && (
        <p className="text-red-400">
          Unknown account type: <code>{accountType}</code>
        </p>
      )}
    </div>
  );
}
