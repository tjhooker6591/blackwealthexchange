/* ------------------------------------------------------------------ */
/* File: components/dashboards/DashboardWrapper.tsx                   */
/* ------------------------------------------------------------------ */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ComponentType } from "react";

import SellerDashboard from "@/components/dashboards/SellerDashboard";
import EmployerDashboard from "@/components/dashboards/EmployerDashboard";
import BusinessDashboard from "@/components/dashboards/BusinessDashboard";
import UserDashboard from "@/components/dashboards/UserDashboard";
import DashboardFrame from "@/components/dashboards/DashboardFrame";

/* ------------------------------------------------------------------ */
/*  Allowed account types & lookup map                                */
/* ------------------------------------------------------------------ */

type AccountType = "seller" | "employer" | "business" | "user";

const DASHBOARD_MAP: Record<AccountType, ComponentType> = {
  seller: SellerDashboard,
  employer: EmployerDashboard,
  business: BusinessDashboard,
  user: UserDashboard,
};

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function DashboardWrapper() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [loading, setLoading] = useState(true);

  /** Fetch session once on mount */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch session");

        const data = await res.json();

        if (!data?.user) {
          router.replace("/login?redirect=/dashboard");
          return;
        }

        setAccountType(data.user.accountType as AccountType);
      } catch (err) {
        console.error(err);
        router.replace("/login?redirect=/dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  /* ───────── Loading state ───────── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading your dashboard…
      </div>
    );
  }

  /* ───────── Auth failed on fetch ───────── */
  if (!accountType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-red-400">
        Unable to determine account type.
      </div>
    );
  }

  /* ───────── Render dashboard inside common frame ───────── */
  const DashboardComponent = DASHBOARD_MAP[accountType];

  return (
    <DashboardFrame>
      <DashboardComponent />
    </DashboardFrame>
  );
}
