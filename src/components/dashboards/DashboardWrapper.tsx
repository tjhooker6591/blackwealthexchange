"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import SellerDashboard from "./SellerDashboard";
import EmployerDashboard from "./EmployerDashboard";
import BusinessDashboard, { type DashboardUser } from "./BusinessDashboard";
import UserDashboard from "./UserDashboard";
import DashboardFrame from "./DashboardFrame";

export default function DashboardWrapper() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<string | null>(null);
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });

        if (!res.ok) {
          router.replace("/login?redirect=/dashboard");
          return;
        }

        const { user } = await res.json();
        if (!user?.accountType) {
          router.replace("/login?redirect=/dashboard");
        } else {
          setUser(user);
          setAccountType(user.accountType);
        }
      } catch {
        router.replace("/login?redirect=/dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37]/35 border-t-[#D4AF37]" />
          <div className="text-base font-extrabold tracking-tight text-white">
            Loading your dashboard…
          </div>
          <div className="mt-1 text-sm text-white/55">
            Preparing your account view.
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardFrame>
      {accountType === "seller" && <SellerDashboard />}
      {accountType === "employer" && <EmployerDashboard />}
      {(accountType === "business" || accountType === "admin") && (
        <BusinessDashboard user={user} />
      )}
      {accountType === "user" && <UserDashboard />}
      {accountType &&
        !["seller", "employer", "business", "user", "admin"].includes(
          accountType,
        ) && (
          <div className="mx-auto mt-6 max-w-xl rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            Unknown account type:{" "}
            <span className="font-semibold">{accountType}</span>
          </div>
        )}
    </DashboardFrame>
  );
}
