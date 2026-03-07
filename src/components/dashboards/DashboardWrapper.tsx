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
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading your dashboard…
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
          <p className="text-red-400">Unknown account type: {accountType}</p>
        )}
    </DashboardFrame>
  );
}
