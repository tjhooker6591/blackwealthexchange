"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import SellerDashboard from "@/components/dashboards/SellerDashboard";
import EmployerDashboard from "@/components/dashboards/EmployerDashboard";
import BusinessDashboard from "@/components/dashboards/BusinessDashboard";
import UserDashboard from "@/components/dashboards/UserDashboard";
import DashboardFrame from "@/components/dashboards/DashboardFrame";

export default function DashboardWrapper() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<string>("");
  const [loading, setLoading] = useState(true);

  /* ─ Fetch session once on mount ─ */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) throw new Error("Failed to fetch session");

        const data = await res.json();
        if (!data?.user) {
          router.push("/login?redirect=/dashboard");
          return;
        }

        setAccountType(data.user.accountType);
      } catch (err) {
        console.error(err);
        router.push("/login?redirect=/dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  /* ─ Loading splash ─ */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading your dashboard…
      </div>
    );
  }

  /* ─ Render the right dashboard inside the responsive frame ─ */
  return (
    <DashboardFrame>
      {accountType === "seller" && <SellerDashboard />}
      {accountType === "employer" && <EmployerDashboard />}
      {accountType === "business" && <BusinessDashboard />}
      {accountType === "user" && <UserDashboard />}
      {!["seller", "employer", "business", "user"].includes(accountType) && (
        <p className="text-red-400">Unknown account type: {accountType}</p>
      )}
    </DashboardFrame>
  );
}
