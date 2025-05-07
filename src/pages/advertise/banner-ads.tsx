// src/pages/advertise/banner-ads.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BuyNowButton from "@/components/BuyNowButton";

export default function BannerAdsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string>("guest");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // ← FIXED: include cache and credentials here
        const res = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) {
          // redirect on unauthorized
          router.replace("/login?redirect=/advertise/banner-ads");
          return;
        }
        const data = await res.json();
        if (data?.user?._id) {
          setUserId(data.user._id);
        }
      } catch (err) {
        console.error("Failed to fetch user from /api/auth/me", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const getAdPrice = (placement: string) => {
    switch (placement) {
      case "homepage-top":
        return 100;
      case "sidebar":
        return 75;
      case "footer":
        return 50;
      case "dashboard":
        return 60;
      default:
        return 0;
    }
  };

  const handleAdSelect = (placement: string) => {
    router.push(`/advertise-form?type=banner&placement=${placement}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 py-10 flex flex-col items-center text-center">
      <h1 className="text-4xl font-bold text-gold mb-4">
        Advertise with Banner Ads
      </h1>
      <p className="text-lg text-gray-400 max-w-2xl mb-10">
        Promote your business with visually engaging banner ads placed across
        high-traffic areas of the platform. Select a banner location below to
        begin the process.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        {[
          {
            title: "Top of Homepage",
            placement: "homepage-top",
            description:
              "Get maximum visibility with a large banner at the very top of the homepage.",
          },
          {
            title: "Sidebar Ad",
            placement: "sidebar",
            description:
              "A persistent sidebar banner visible throughout user navigation.",
          },
          {
            title: "Footer Banner",
            placement: "footer",
            description:
              "Appears at the bottom of every page — great for long-term visibility.",
          },
          {
            title: "User Dashboard",
            placement: "dashboard",
            description:
              "Display your banner on the business or user dashboard for targeted exposure.",
          },
        ].map((banner) => (
          <div
            key={banner.placement}
            className="bg-white text-black rounded-2xl shadow-lg p-6 flex flex-col items-center"
          >
            <h2 className="text-2xl font-semibold mb-2">{banner.title}</h2>
            <p className="text-gray-600 mb-4 text-sm">{banner.description}</p>
            <button
              onClick={() => handleAdSelect(banner.placement)}
              className="px-5 py-2 bg-black text-gold rounded hover:bg-gray-900 transition mb-2"
            >
              Select This Placement
            </button>
            <BuyNowButton
              userId={userId}
              itemId={`banner-${banner.placement}`}
              amount={getAdPrice(banner.placement)}
              type="ad"
            />
          </div>
        ))}
      </div>

      <div className="mt-10">
        <Link href="/advertise-with-us">
          <button className="px-6 py-2 bg-gold text-black font-semibold rounded hover:bg-yellow-400 transition">
            Go Back to Ad Options
          </button>
        </Link>
      </div>
    </div>
  );
}
