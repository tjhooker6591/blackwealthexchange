// src/pages/advertise/banner-ads.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { emitFlowEvent } from "@/lib/analytics/flowEvents";
import {
  getAdDurationOptions,
  type AdOptionId,
} from "@/lib/advertising/pricing";
import { toPublicErrorMessage } from "@/lib/publicError";

// Real, currently-active advertising placement options for the Business
// Directory / search page -- verified against current code, not older
// public documentation (2026-09-07 correction). Each maps to a real
// `option` (Stripe/pricing product id) + `placement` (sub-slot id) pair
// that already flows end to end: submit -> advertising_requests ->
// checkout metadata -> Stripe webhook -> admin review
// (src/pages/admin/advertising-requests.tsx already displays
// `Placement: {r.placement}` distinctly).
//
// A "homepage top banner" option is deliberately NOT included here: the
// owner has confirmed no such placement currently exists, even though a
// dormant `placement: "homepage-top"` code path still exists in
// src/pages/api/advertising/public-placements.ts and src/pages/index.tsx
// (renders nothing today because no such campaign has ever been sold).
// That dormant code path is reported separately as a stale-placement
// cleanup item, not modified here.
type PlacementOption = {
  title: string;
  option: AdOptionId;
  placement: string;
  description: string;
};

const PLACEMENTS: PlacementOption[] = [
  {
    title: "Search Page Sidebar",
    option: "banner-ad",
    placement: "sidebar",
    description:
      "Banner card in the Business Directory search-results sidebar. Capacity is dynamic -- shown to every visitor browsing the directory, not capped to a fixed small number of slots.",
  },
  {
    title: "Featured Placement in Search Results",
    option: "directory-featured",
    placement: "search-results",
    description:
      "Featured card shown directly within Business Directory search results, above standard organic listings.",
  },
];

function durationOptionsFor(option: AdOptionId) {
  return getAdDurationOptions(option).map((d) => ({
    label:
      d.durationDays === 7
        ? "1 Week"
        : d.durationDays === 14
          ? "2 Weeks"
          : d.durationDays === 30
            ? "1 Month"
            : `${d.durationDays} Days`,
    value: String(d.durationDays),
    priceLabel: `$${d.amountDollars}`,
  }));
}

export default function BannerAdsPage() {
  const router = useRouter();

  const trackAdEvent = (
    eventType: string,
    extras: Record<string, unknown> = {},
  ) => {
    emitFlowEvent({
      eventType,
      pageRoute: "/advertise/banner-ads",
      section: "advertise_banner_ads",
      ...extras,
    });
  };

  const [loadingUser, setLoadingUser] = useState(true);
  const [selectedPlacement, setSelectedPlacement] = useState<string | null>(
    null,
  );
  const [duration, setDuration] = useState<string>("");
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [notes, setNotes] = useState("");
  const [creativeUrl, setCreativeUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    trackAdEvent("advertising_landing_viewed");

    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });

        if (!res.ok) {
          return;
        }

        const data = await res.json().catch(() => ({}));
        if (data?.user?.email) setEmail(String(data.user.email));
        if (data?.user?.name) setName(String(data.user.name));
        if (data?.user?.businessName)
          setBusinessName(String(data.user.businessName));
      } catch (err) {
        console.error("Failed to fetch user from /api/auth/me", err);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUser();
  }, [router]);

  const selectedPlacementMeta = useMemo(() => {
    if (!selectedPlacement) return null;
    return PLACEMENTS.find((p) => p.placement === selectedPlacement) || null;
  }, [selectedPlacement]);

  // Pricing genuinely varies by placement (e.g. Search Page Sidebar is
  // $199/$349, Featured Search Results is $99/30 days only) -- the
  // available duration options must follow whichever placement is
  // currently selected, not a single hardcoded banner-ad price list.
  const durationOptions = useMemo(
    () => durationOptionsFor(selectedPlacementMeta?.option || "banner-ad"),
    [selectedPlacementMeta],
  );

  useEffect(() => {
    if (!durationOptions.length) {
      setDuration("");
      return;
    }
    if (!durationOptions.some((d) => d.value === duration)) {
      setDuration(durationOptions[0].value);
    }
  }, [durationOptions, duration]);

  const selectedDurationMeta = useMemo(() => {
    return durationOptions.find((d) => d.value === duration) || null;
  }, [durationOptions, duration]);

  const handleProceedToCheckout = async () => {
    setError("");
    if (!selectedPlacement || !selectedPlacementMeta) {
      setError("Please select an advertising placement before proceeding.");
      return;
    }

    if (
      name.trim().length < 2 ||
      businessName.trim().length < 2 ||
      !/^\S+@\S+\.\S+$/.test(email.trim())
    ) {
      setError("Please add your campaign contact details before checkout.");
      return;
    }

    if (!/^https?:\/\//i.test(creativeUrl.trim())) {
      setError("Please provide a valid banner creative URL (https://...).");
      return;
    }

    const selectedOption = selectedPlacementMeta.option;

    setSubmitting(true);
    trackAdEvent("advertising_submission_started", {
      ctaId: "banner_proceed_to_checkout",
      ad_option: selectedOption,
      ad_type: selectedOption,
      package_type: selectedOption,
      source_variant: "banner_ads",
      placement: selectedPlacement,
      duration_days: Number(duration),
    });
    try {
      const submitRes = await fetch("/api/advertising/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          email,
          businessName,
          adText:
            notes ||
            `${selectedPlacementMeta.title} campaign request (${selectedPlacement})`,
          adImage: creativeUrl.trim(),
          website,
          budget: selectedDurationMeta?.priceLabel.replace("$", "") || "",
          option: selectedOption,
          durationDays: Number(duration),
          placement: selectedPlacement,
        }),
      });

      const submitData = await submitRes.json().catch(() => ({}));
      if (!submitRes.ok) {
        throw new Error(
          "We couldn't save your banner campaign right now. Please try again.",
        );
      }

      const requestId = submitData?.requestId || submitData?.adId;

      trackAdEvent("advertising_checkout_started", {
        ad_option: selectedOption,
        ad_type: selectedOption,
        package_type: selectedOption,
        checkout_variant: "unified_advertising_checkout",
        source_variant: "banner_ads",
        placement: selectedPlacement,
        duration_days: Number(duration),
        campaignId: requestId || null,
        destination: "/advertising/checkout",
      });

      const query = new URLSearchParams({
        option: selectedOption,
        duration: duration,
        placement: selectedPlacement,
      });
      if (requestId) query.set("campaignId", requestId);

      router.push(`/advertising/checkout?${query.toString()}`);
    } catch (e: any) {
      setError(
        toPublicErrorMessage(e?.message, {
          fallback:
            "We couldn't continue to checkout right now. Please try again.",
          authFallback: "Please sign in to continue to secure checkout.",
        }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 py-10 flex flex-col items-center text-center">
      <h1 className="text-4xl font-bold text-gold mb-4">
        Advertise on the Business Directory
      </h1>

      <p className="text-lg text-gray-400 max-w-2xl mb-6">
        Choose your placement and duration to submit a campaign request.
        Campaigns go live only after review, approval, and confirmed placement
        scheduling.
      </p>

      <div className="w-full max-w-3xl mb-8">
        {loadingUser ? (
          <div className="rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-gray-300">
            Checking your account details for faster checkout...
          </div>
        ) : email ? (
          <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-200">
            We found your account details and prefilled the campaign form where
            possible.
          </div>
        ) : (
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
            You can review pricing and submit your banner campaign without a
            detected session, but secure checkout may ask you to log in before
            payment.
          </div>
        )}
      </div>

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
                onClick={() => {
                  setSelectedPlacement(banner.placement);
                  trackAdEvent("advertising_option_selected", {
                    ctaId: `banner_placement_${banner.placement}`,
                    ctaLabel: banner.title,
                    ad_option: banner.option,
                    placement: banner.placement,
                  });
                }}
                className={`px-5 py-2 rounded transition mb-2 ${
                  active
                    ? "bg-gold text-black font-semibold"
                    : "bg-black text-gold hover:bg-gray-900"
                }`}
              >
                {active ? "Selected Placement" : "Select This Placement"}
              </button>

              <p className="text-xs text-gray-500 mt-1">
                This selects your preferred inventory request for admin review.
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
          Pricing depends on the placement you selected above and its campaign
          duration. Placement selected above is treated as requested inventory
          and is confirmed during fulfillment.
        </p>

        <div className="flex justify-center gap-4 flex-wrap">
          {durationOptions.map((opt) => {
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
            {selectedDurationMeta?.label || "—"}
          </div>
          <div className="text-sm text-zinc-300 mt-1">
            <span className="font-semibold text-white">Checkout Price:</span>{" "}
            <span className="text-gold">
              {selectedDurationMeta?.priceLabel || "See pricing"}
            </span>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-4 text-left space-y-3">
          <h3 className="text-base font-semibold text-white">
            Campaign Details
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-black text-white border border-gray-600 rounded p-2"
            />
            <input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Business name"
              className="w-full bg-black text-white border border-gray-600 rounded p-2"
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              type="email"
              className="w-full bg-black text-white border border-gray-600 rounded p-2"
            />
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="Website (optional)"
              className="w-full bg-black text-white border border-gray-600 rounded p-2"
            />
          </div>
          <input
            value={creativeUrl}
            onChange={(e) => setCreativeUrl(e.target.value)}
            placeholder="Banner creative URL (https://...)"
            className="w-full bg-black text-white border border-gray-600 rounded p-2"
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Campaign notes (offer, CTA, dates)"
            className="w-full bg-black text-white border border-gray-600 rounded p-2 min-h-[90px]"
          />
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
