// src/pages/advertise/banner-ads.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

type BannerPlacement = "homepage-top" | "sidebar" | "footer" | "dashboard";
type BannerDuration = "14" | "30";

/**
 * IMPORTANT:
 * This page now uses the SAME advertising checkout flow as the rest of the ad system:
 * /advertising/checkout?option=banner-ad&duration=...
 *
 * Pricing here is aligned to the current server/banner pricing flow.
 * If you later change pricing, update shared pricing + use shared pricing import here.
 */
const BANNER_DURATION_OPTIONS: Array<{
  label: string;
  value: BannerDuration;
  priceLabel: string;
}> = [
  { label: "2 Weeks", value: "14", priceLabel: "$199" },
  { label: "1 Month", value: "30", priceLabel: "$349" },
];

const PLACEMENTS: Array<{
  title: string;
  placement: BannerPlacement;
  description: string;
}> = [
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
      "Appears at the bottom of key pages — great for long-term visibility.",
  },
  {
    title: "User Dashboard",
    placement: "dashboard",
    description:
      "Display your banner on the business or user dashboard for targeted exposure.",
  },
];

export default function BannerAdsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [selectedPlacement, setSelectedPlacement] =
    useState<BannerPlacement | null>(null);
  const [duration, setDuration] = useState<BannerDuration>("14");
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });

        if (!res.ok) {
          router.replace("/login?redirect=/advertise/banner-ads");
          return;
        }

        const data = await res.json().catch(() => ({}));
        if (data?.user?.email) setEmail(String(data.user.email));
        if (data?.user?.name) setName(String(data.user.name));
        if (data?.user?.businessName) setBusinessName(String(data.user.businessName));
      } catch (err) {
        console.error("Failed to fetch user from /api/auth/me", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const selectedPlacementMeta = useMemo(() => {
    if (!selectedPlacement) return null;
    return PLACEMENTS.find((p) => p.placement === selectedPlacement) || null;
  }, [selectedPlacement]);

  const selectedDurationMeta = useMemo(() => {
    return BANNER_DURATION_OPTIONS.find((d) => d.value === duration) || null;
  }, [duration]);

  const handleProceedToCheckout = async () => {
    setError("");
    if (!selectedPlacement) {
      setError("Please select a banner placement before proceeding.");
      return;
    }

    if (name.trim().length < 2 || businessName.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Please add your campaign contact details before checkout.");
      return;
    }

    setSubmitting(true);
    try {
      const submitRes = await fetch("/api/advertising/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          email,
          businessName,
          adText: notes || `Banner ad campaign request (${selectedPlacement})`,
          adImage: "",
          website,
          budget: duration === "14" ? "199" : "349",
          option: "banner-ad",
          durationDays: Number(duration),
          placement: selectedPlacement,
        }),
      });

      const submitData = await submitRes.json().catch(() => ({}));
      if (!submitRes.ok) {
        throw new Error(submitData?.error || "Failed to save banner request");
      }

      const requestId = submitData?.requestId || submitData?.adId;
      const query = new URLSearchParams({
        option: "banner-ad",
        duration: duration,
        placement: selectedPlacement,
      });
      if (requestId) query.set("campaignId", requestId);

      router.push(`/advertising/checkout?${query.toString()}`);
    } catch (e: any) {
      setError(e?.message || "Unable to proceed to checkout");
    } finally {
      setSubmitting(false);
    }
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
        high-traffic areas of the platform. Select a banner placement and
        campaign duration below to begin checkout.
      </p>

      {/* Placement cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl">
        {PLACEMENTS.map((banner) => {
          const active = selectedPlacement === banner.placement;

          return (
            <div
              key={banner.placement}
              className={`rounded-2xl shadow-lg p-6 flex flex-col items-center border transition ${
                active
                  ? "bg-white text-black border-yellow-400 ring-2 ring-yellow-400/70"
                  : "bg-white text-black border-transparent"
              }`}
            >
              <h2 className="text-2xl font-semibold mb-2">{banner.title}</h2>
              <p className="text-gray-600 mb-4 text-sm">{banner.description}</p>

              <button
                onClick={() => setSelectedPlacement(banner.placement)}
                className={`px-5 py-2 rounded transition mb-2 ${
                  active
                    ? "bg-gold text-black font-semibold"
                    : "bg-black text-gold hover:bg-gray-900"
                }`}
              >
                {active ? "Selected Placement" : "Select This Placement"}
              </button>

              <p className="text-xs text-gray-500 mt-1">
                Placement selection is included with your campaign request.
              </p>
            </div>
          );
        })}
      </div>

      {/* Duration / pricing */}
      <div className="w-full max-w-4xl mt-10 rounded-2xl border border-yellow-500/20 bg-zinc-950 p-6">
        <h2 className="text-2xl font-bold text-gold mb-3">
          Pricing & Duration
        </h2>
        <p className="text-sm text-zinc-300 mb-6">
          Banner checkout pricing is based on campaign duration. Placement is
          selected above and submitted with your banner campaign request.
        </p>

        <div className="flex justify-center gap-4 flex-wrap">
          {BANNER_DURATION_OPTIONS.map((opt) => {
            const active = duration === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setDuration(opt.value)}
                className={`min-w-[150px] rounded-xl border px-5 py-4 transition ${
                  active
                    ? "border-gold bg-white/10"
                    : "border-white/20 bg-black hover:bg-white/5"
                }`}
              >
                <div className="text-base font-semibold text-white">
                  {opt.label}
                </div>
                <div className="text-gold font-bold mt-1">{opt.priceLabel}</div>
              </button>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-6 rounded-xl border border-white/10 bg-black/40 p-4 text-left">
          <div className="text-sm text-zinc-300">
            <span className="font-semibold text-white">
              Selected Placement:
            </span>{" "}
            {selectedPlacementMeta
              ? selectedPlacementMeta.title
              : "None selected"}
          </div>
          <div className="text-sm text-zinc-300 mt-1">
            <span className="font-semibold text-white">Duration:</span>{" "}
            {selectedDurationMeta?.label || "2 Weeks"}
          </div>
          <div className="text-sm text-zinc-300 mt-1">
            <span className="font-semibold text-white">Checkout Price:</span>{" "}
            <span className="text-gold">
              {selectedDurationMeta?.priceLabel || "$199"}
            </span>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-4 text-left space-y-3">
          <h3 className="text-base font-semibold text-white">Campaign Details</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Your name" className="w-full bg-black text-white border border-gray-600 rounded p-2" />
            <input value={businessName} onChange={(e)=>setBusinessName(e.target.value)} placeholder="Business name" className="w-full bg-black text-white border border-gray-600 rounded p-2" />
            <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email" type="email" className="w-full bg-black text-white border border-gray-600 rounded p-2" />
            <input value={website} onChange={(e)=>setWebsite(e.target.value)} placeholder="Website (optional)" className="w-full bg-black text-white border border-gray-600 rounded p-2" />
          </div>
          <textarea value={notes} onChange={(e)=>setNotes(e.target.value)} placeholder="Campaign notes (offer, CTA, dates)" className="w-full bg-black text-white border border-gray-600 rounded p-2 min-h-[90px]" />
        </div>

        <div className="mt-6">
          {error ? <p className="text-sm text-red-300 mb-2">{error}</p> : null}
          <button
            onClick={handleProceedToCheckout}
            disabled={submitting}
            className={`w-full md:w-auto px-8 py-3 rounded font-semibold transition ${
              selectedPlacement && !submitting
                ? "bg-gold text-black hover:bg-yellow-400"
                : "bg-gray-700 text-gray-300 cursor-not-allowed"
            }`}
          >
            {submitting ? "Saving Request..." : "Proceed to Checkout"}
          </button>
        </div>

        <p className="mt-3 text-xs text-zinc-500">
          This sends you to the unified advertising checkout flow to keep
          pricing and fulfillment consistent.
        </p>
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
