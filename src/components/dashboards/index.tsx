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
    // Immediately invoked async function to handle session fetching
    (async () => {
      try {
        const res = await fetch("/api/auth/me");

        // Check if the response status is OK
        if (!res.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await res.json();

        // If no user is found, redirect to login with a redirect query parameter
        if (!data?.user) {
          router.push("/login?redirect=/dashboard");
          return;
        }

        // Set the account type from the fetched data
        setAccountType(data.user.accountType);
      } catch (error) {
        console.error("Failed to fetch session:", error);
        // Redirect to login on error as well
        router.push("/login?redirect=/dashboard");
      } finally {
        // Finish loading regardless of success or error
        setLoading(false);
      }
    })();
  }, [router]);

  // While loading, display a loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  // Render the dashboard view based on accountType
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold text-gold mb-4">
        BWE Global Dashboard
      </h1>
      {accountType === "seller" && <SellerDashboard />}
      {accountType === "business" && <BusinessDashboard />}
      {accountType === "employer" && <EmployerDashboard />}
      {accountType === "user" && <UserDashboard />}
      {/* Fallback view if accountType is unknown */}
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
