// src/pages/advertise/business-directory.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

type PlanType = "standard" | "featured";

export default function BusinessDirectoryAdPage() {
  const router = useRouter();

  const [loadingUser, setLoadingUser] = useState(true);
  const [businessId, setBusinessId] = useState<string>("");
  const [userAccountType, setUserAccountType] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    const fetchSession = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });

        if (!res.ok) {
          // Let them still view page, but checkout may require login.
          return;
        }

        const data = await res.json();

        // Try multiple common shapes safely
        const sessionUser = data?.user || {};
        const topBusiness = data?.business || {};

        const resolvedBusinessId =
          (typeof sessionUser?.businessId === "string" &&
            sessionUser.businessId) ||
          (typeof topBusiness?._id === "string" && topBusiness._id) ||
          // If logged in as a business account, often the session user _id is the business record id
          (sessionUser?.accountType === "business" &&
          typeof sessionUser?._id === "string"
            ? sessionUser._id
            : "");

        if (!mounted) return;

        setUserAccountType(
          typeof sessionUser?.accountType === "string"
            ? sessionUser.accountType
            : "",
        );
        setBusinessId(resolvedBusinessId || "");
      } catch (err) {
        console.error("Failed to fetch session for directory ad checkout", err);
      } finally {
        if (mounted) setLoadingUser(false);
      }
    };

    fetchSession();

    return () => {
      mounted = false;
    };
  }, []);

  const checkoutUrlForPlan = useMemo(() => {
    return (plan: PlanType) => {
      const config =
        plan === "standard"
          ? { option: "directory-standard", duration: 30 }
          : { option: "directory-featured", duration: 30 };

      const params = new URLSearchParams({
        option: config.option,
        duration: String(config.duration),
      });

      // ✅ Critical for linking paid directory purchases to a listing/admin workflow
      if (businessId) params.set("businessId", businessId);

      return `/advertising/checkout?${params.toString()}`;
    };
  }, [businessId]);

  const handleSelectPlan = (plan: PlanType) => {
    router.push(checkoutUrlForPlan(plan));
  };

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12 flex flex-col items-center text-center">
      <h1 className="text-4xl font-bold text-gold mb-4">
        Promote Your Business in the Directory
      </h1>

      <p className="text-lg text-gray-400 max-w-2xl mb-10">
        Feature your business at the top of relevant categories in our
        Black-Owned Business Directory. Get seen by users actively searching for
        services like yours.
      </p>

      {/* Tracking / linking notice */}
      <div className="w-full max-w-3xl mb-8">
        {loadingUser ? (
          <div className="rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-gray-300">
            Checking your account information for directory listing linking…
          </div>
        ) : businessId ? (
          <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-200">
            Your purchase will be linked to your business record for tracking
            and admin review.
          </div>
        ) : (
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
            We could not detect a linked business ID for your session. You can
            still continue, but the payment may show as{" "}
            <span className="font-semibold">paid but unlinked</span> in admin
            until manually attached.
            {userAccountType && (
              <span className="block mt-1 text-yellow-100/90">
                Current account type detected:{" "}
                <span className="font-semibold">{userAccountType}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Benefits Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mb-14">
        {[
          {
            title: "Top Placement",
            text: "Be seen first in your business category to increase traffic and credibility.",
          },
          {
            title: "Community Support",
            text: "Let customers who care about supporting Black-owned businesses find you.",
          },
          {
            title: "Flexible Options",
            text: "Choose a standard or featured directory placement based on your visibility goals.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="bg-gray-800 rounded-xl p-6 text-left shadow-lg"
          >
            <h3 className="text-xl font-semibold mb-2 text-gold">
              {item.title}
            </h3>
            <p className="text-sm text-gray-300">{item.text}</p>
          </div>
        ))}
      </div>

      {/* Plan Options */}
      <div className="max-w-4xl w-full">
        <h2 className="text-2xl font-bold text-gold mb-6">Choose Your Plan</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Standard Listing */}
          <div className="bg-white text-black rounded-xl p-6 shadow-lg flex flex-col justify-between items-center text-center space-y-4">
            <div>
              <h3 className="text-2xl font-bold mb-2">Standard Listing</h3>
              <p className="text-sm mb-4">
                Appear in the directory under your selected category. Great for
                visibility and credibility.
              </p>
              <ul className="text-sm list-disc list-inside mb-4 text-left">
                <li>Listed for 30 days</li>
                <li>One business category</li>
                <li>Clickable profile</li>
              </ul>
            </div>
            <div className="space-y-2 w-full">
              <button
                onClick={() => handleSelectPlan("standard")}
                className="w-full px-4 py-2 bg-black text-gold rounded hover:bg-gray-900 transition"
              >
                $49 - Select Plan
              </button>
            </div>
          </div>

          {/* Featured Listing */}
          <div className="bg-white text-black rounded-xl p-6 shadow-lg flex flex-col justify-between items-center text-center space-y-4">
            <div>
              <h3 className="text-2xl font-bold mb-2">Featured Listing</h3>
              <p className="text-sm mb-4">
                Stand out at the top of the directory with a highlighted badge
                and priority placement.
              </p>
              <ul className="text-sm list-disc list-inside mb-4 text-left">
                <li>Featured for 30 days</li>
                <li>Highlighted background</li>
                <li>Priority category placement</li>
              </ul>
            </div>
            <div className="space-y-2 w-full">
              <button
                onClick={() => handleSelectPlan("featured")}
                className="w-full px-4 py-2 bg-black text-gold rounded hover:bg-gray-900 transition"
              >
                $99 - Select Plan
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Ad Options */}
      <div className="mt-12">
        <Link href="/advertise-with-us">
          <button className="px-6 py-2 bg-gold text-black font-semibold rounded hover:bg-yellow-400 transition">
            Back to Advertising Options
          </button>
        </Link>
      </div>

      {/* Accuracy note */}
      <div className="mt-6 max-w-2xl">
        <p className="text-xs text-gray-500">
          Checkout is started from the selected plan above so pricing and
          duration stay aligned with the advertising checkout system.
        </p>
      </div>
    </div>
  );
}
