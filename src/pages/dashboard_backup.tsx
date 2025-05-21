"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function DashboardRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      console.warn("No session found. Redirecting to login.");
      router.replace("/login");
      return;
    }

    const accountType = session.user.accountType;

    switch (accountType) {
      case "employer":
        router.replace("/dashboard/employer");
        break;
      case "business":
        router.replace("/dashboard/business");
        break;
      case "seller":
        router.replace("/dashboard/seller");
        break;
      default:
        // covers "user", "jobSeeker", or any other roles
        router.replace("/dashboard/user");
        break;
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white text-xl">
        Loading your dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-6">
      <div className="bg-gray-800 p-6 rounded-lg shadow-md text-center max-w-md w-full">
        <h2 className="text-2xl font-bold text-gold">Redirecting...</h2>
        <p className="text-gray-300 mt-2">
          Please wait while we load your dashboard.
        </p>
        <Link href="/" className="text-blue-400 underline mt-4 inline-block">
          Return to Home
        </Link>
      </div>
    </div>
  );
}
