// components/dashboard/DashboardWrapper.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import SellerDashboard from "./SellerDashboard";
import EmployerDashboard from "./EmployerDashboard";
import BusinessDashboard from "./BusinessDashboard";
import UserDashboard from "./UserDashboard";

export default function DashboardWrapper() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<string>("");
  const [loading, setLoading] = useState(true);

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
        // Log the retrieved account type for debugging.
        console.log("Retrieved account type:", data.user.accountType);
        setAccountType(data.user.accountType);
      } catch (error) {
        console.error(error);
        router.push("/login?redirect=/dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading your dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold text-gold mb-4">BWE Global Dashboard</h1>
      {accountType === "seller" && <SellerDashboard />}
      {accountType === "employer" && <EmployerDashboard />}
      {accountType === "business" && <BusinessDashboard />}
      {accountType === "user" && <UserDashboard />}
      {!["seller", "employer", "business", "user"].includes(accountType) && (
        <p className="text-red-400">
          Unknown account type: {accountType}
        </p>
      )}
    </div>
  );
}
