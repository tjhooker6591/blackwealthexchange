"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import SellerDashboard from "./SellerDashboard";
import EmployerDashboard from "./EmployerDashboard";
import BusinessDashboard, { type DashboardUser } from "./BusinessDashboard";
import UserDashboard from "./UserDashboard";

type SessionResponse = {
  user?: DashboardUser | null;
};

export default function DashboardWrapper() {
  const router = useRouter();

  const [user, setUser] = useState<DashboardUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authRedirecting, setAuthRedirecting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    const loadSession = async () => {
      try {
        setLoading(true);
        setAuthRedirecting(false);

        const res = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
          signal: controller.signal,
        });

        if (!res.ok) {
          if (!mounted) return;
          setAuthRedirecting(true);
          router.replace("/login?redirect=/dashboard");
          return;
        }

        const data: SessionResponse = await res.json();
        const sessionUser = data?.user ?? null;

        if (!sessionUser?.accountType) {
          if (!mounted) return;
          setAuthRedirecting(true);
          router.replace("/login?redirect=/dashboard");
          return;
        }

        if (!mounted) return;
        setUser(sessionUser);
      } catch (error: any) {
        if (error?.name === "AbortError") return;

        console.error("Failed to fetch session:", error);

        if (!mounted) return;
        setAuthRedirecting(true);
        router.replace("/login?redirect=/dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadSession();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [router]);

  const accountType = useMemo(() => {
    return String(user?.accountType || "");
  }, [user?.accountType]);

  if (loading || authRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4 text-white">
        <p className="text-sm sm:text-base text-center">
          Loading your dashboard...
        </p>
      </div>
    );
  }

  if (!user?.accountType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4 text-white">
        <p className="text-sm sm:text-base text-center">
          Redirecting to login...
        </p>
      </div>
    );
  }

  if (accountType === "seller") {
    return <SellerDashboard />;
  }

  if (accountType === "business" || accountType === "admin") {
    return <BusinessDashboard user={user} />;
  }

  if (accountType === "employer") {
    return <EmployerDashboard />;
  }

  if (accountType === "user") {
    return <UserDashboard />;
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 py-10">
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl text-center">
        <h1 className="text-xl sm:text-2xl font-extrabold text-yellow-300">
          Unknown account type
        </h1>
        <p className="mt-2 text-sm text-gray-300">
          We could not match this account to a dashboard.
        </p>
        <p className="mt-3 text-xs text-gray-400 break-all">
          Account type:{" "}
          <span className="text-white">{accountType || "none"}</span>
        </p>
      </div>
    </div>
  );
}
