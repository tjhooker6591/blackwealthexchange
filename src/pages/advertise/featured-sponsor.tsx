// src/pages/advertise/featured-sponsor.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { emitFlowEvent } from "@/lib/analytics/flowEvents";
import { getAdDurationOptions, getAdQuote } from "@/lib/advertising/pricing";

export default function FeaturedSponsorPage() {
  const router = useRouter();

  const trackAdEvent = (
    eventType: string,
    extras: Record<string, unknown> = {},
  ) => {
    emitFlowEvent({
      eventType,
      pageRoute: "/advertise/featured-sponsor",
      section: "advertise_featured_sponsor",
      ...extras,
    });
  };
  const [adImageFile, setAdImageFile] = useState<File | null>(null);
  const [campaignDuration, setCampaignDuration] = useState<string>("");
  const [confirmed, setConfirmed] = useState(false);
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [notes, setNotes] = useState("");
  const [campaignTitle, setCampaignTitle] = useState("");
  const [requestedStartDate, setRequestedStartDate] = useState("");
  const [flexibleStart, setFlexibleStart] = useState(true);
  const [targetUrl, setTargetUrl] = useState("");
  const [creativeUrl, setCreativeUrl] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const featuredDurationOptions = useMemo(
    () => getAdDurationOptions("featured-sponsor"),
    [],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAdImageFile(e.target.files[0]);
    }
  };

  useEffect(() => {
    trackAdEvent("advertising_landing_viewed");
  }, []);

  const hasCreative =
    Boolean(adImageFile) || /^https?:\/\//i.test(creativeUrl.trim());
  const hasValidEmail = /^\S+@\S+\.\S+$/.test(email.trim());
  const canProceed = useMemo(() => {
    return (
      Boolean(campaignDuration) &&
      confirmed &&
      hasCreative &&
      name.trim().length >= 2 &&
      businessName.trim().length >= 2 &&
      hasValidEmail
    );
  }, [
    campaignDuration,
    confirmed,
    hasCreative,
    name,
    businessName,
    hasValidEmail,
  ]);

  const handleProceed = async () => {
    setError("");
    if (!canProceed) {
      setError(
        "Please complete the campaign details and confirm before checkout.",
      );
      return;
    }

    setSubmitting(true);
    trackAdEvent("advertising_submission_started", {
      ctaId: "featured_proceed_to_checkout",
      ad_option: "featured-sponsor",
      ad_type: "featured-sponsor",
      package_type: "featured",
      source_variant: "featured_sponsor_page",
      duration_days: Number(campaignDuration),
      placement: "homepage-featured-sponsor",
    });
    try {
      const payload = {
        name,
        email,
        businessName,
        campaignTitle: campaignTitle || `${businessName} Featured Sponsor`,
        adText: notes || "Featured sponsor campaign request",
        adImage: adImageFile?.name || creativeUrl.trim(),
        website,
        targetUrl: targetUrl || website,
        budget: String(
          getAdQuote({
            option: "featured-sponsor",
            durationDays: Number(campaignDuration),
          })?.amountDollars || "",
        ),
        option: "featured-sponsor",
        durationDays: Number(campaignDuration),
        placement: "homepage-featured-sponsor",
        requestedStartDate: requestedStartDate || undefined,
        flexibleStart,
      };

      const res = await fetch("/api/advertising/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to save ad request");

      const requestId = data?.requestId || data?.adId;

      trackAdEvent("advertising_checkout_started", {
        ad_option: "featured-sponsor",
        ad_type: "featured-sponsor",
        package_type: "featured",
        checkout_variant: "unified_advertising_checkout",
        source_variant: "featured_sponsor_page",
        duration_days: Number(campaignDuration),
        placement: "homepage-featured-sponsor",
        campaignId: requestId || null,
        destination: "/advertising/checkout",
      });

      const query = new URLSearchParams({
        option: "featured-sponsor",
        duration: campaignDuration,
      });
      if (requestId) query.set("campaignId", requestId);
      query.set("placement", "homepage-featured-sponsor");

      router.push(`/advertising/checkout?${query.toString()}`);
    } catch (e: any) {
      setError(e?.message || "Unable to continue to checkout");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <section className="text-center">
          <h1 className="text-4xl font-bold text-gold mb-4">
            Become a Featured Sponsor
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Every Black-owned business is welcome in our free directory — but if
            you want to
            <span className="text-gold font-semibold"> stand out</span>,
            Featured Sponsor Ads place your brand in the homepage Featured
            Sponsors rail (and sponsor modules that read that feed).
          </p>
          <p className="text-gray-500 mt-4">
            Featured Sponsor campaigns are scheduled into the homepage Featured
            Sponsors rail. Placement is approval-based and follows weekly
            capacity.
          </p>
        </section>

        {/* Limited Slots Info */}
        <section className="bg-gray-800 p-6 rounded-lg shadow text-left mt-10">
          <h2 className="text-2xl font-bold text-gold mb-4">
            Limited Availability: Weekly Sponsor Slots
          </h2>
          <p className="text-gray-300 mb-4">
            Your business appears in the{" "}
            <strong>homepage Featured Sponsors rail</strong>. Campaign weeks are
            assigned by schedule and can roll to the next available week when
            capacity is full.
          </p>
          <p className="text-gray-300 mb-4">
            Duration is sold in 7, 14, or 30-day packages and mapped to weekly
            schedule blocks. If your requested week is full, your campaign is
            queued into the next open week.
          </p>
          <p className="text-yellow-400 font-semibold">
            Reserve your placement early to secure visibility during your ideal
            timeframe.
          </p>
        </section>

        {/* Benefits */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "Homepage Placement",
              text: "Your brand is scheduled into the homepage Featured Sponsors rail with sponsor labeling.",
            },
            {
              title: "High Visibility",
              text: "Reach thousands of engaged users actively exploring Black-owned brands.",
            },
            {
              title: "Priority Exposure",
              text: "Approval + weekly scheduling keep placement predictable and auditable.",
            },
          ].map((item) => (
            <div key={item.title} className="bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold text-gold mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-gray-300">{item.text}</p>
            </div>
          ))}
        </section>

        {/* Pricing Options */}
        <section className="text-center">
          <h2 className="text-2xl font-bold text-gold mb-4">
            Pricing & Duration
          </h2>
          <p className="text-gray-400 mb-6">
            Choose a duration that fits your campaign needs. Featured Sponsor
            placement is the homepage sponsor rail, scheduled by campaign week.
          </p>
          <div className="flex justify-center gap-6 flex-wrap">
            {featuredDurationOptions.map(({ durationDays, amountDollars }) => {
              const value = String(durationDays);
              const label =
                durationDays === 7
                  ? "1 Week"
                  : durationDays === 14
                    ? "2 Weeks"
                    : durationDays === 30
                      ? "1 Month"
                      : `${durationDays} Days`;
              const price = `$${amountDollars}`;
              return (
                <div
                  key={value}
                  onClick={() => {
                    setCampaignDuration(value);
                    trackAdEvent("advertising_option_selected", {
                      ctaId: `featured_duration_${value}`,
                      ctaLabel: `${label} ${price}`,
                      ad_option: "featured-sponsor",
                      duration_days: Number(value),
                    });
                  }}
                  className={`cursor-pointer p-6 rounded-lg border ${
                    campaignDuration === value
                      ? "border-gold bg-gray-800"
                      : "border-gray-600"
                  }`}
                >
                  <h4 className="text-lg font-semibold text-white">{label}</h4>
                  <p className="text-gold">{price}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Upload Sponsor Graphic */}
        <section className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4 text-gold">
            Upload Your Sponsor Ad Graphic
          </h3>
          <p className="text-sm text-gray-400 mb-2">
            This image is used for your Featured Sponsor card in scheduled
            sponsor placements. Upload a file or provide a hosted creative URL
            below.
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full bg-black text-white border border-gray-600 rounded p-2"
          />
          <input
            value={creativeUrl}
            onChange={(e) => setCreativeUrl(e.target.value)}
            placeholder="https://... (optional if file uploaded)"
            className="mt-3 w-full bg-black text-white border border-gray-600 rounded p-2"
          />
        </section>

        <section className="bg-gray-800 p-6 rounded-lg space-y-4 text-left">
          <h3 className="text-xl font-semibold text-gold">Campaign Details</h3>
          <div className="grid md:grid-cols-2 gap-4">
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
            <input
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="Target URL for sponsor click-through"
              className="w-full bg-black text-white border border-gray-600 rounded p-2"
            />
            <input
              value={campaignTitle}
              onChange={(e) => setCampaignTitle(e.target.value)}
              placeholder="Campaign title (optional)"
              className="w-full bg-black text-white border border-gray-600 rounded p-2"
            />
            <input
              value={requestedStartDate}
              onChange={(e) => setRequestedStartDate(e.target.value)}
              type="date"
              className="w-full bg-black text-white border border-gray-600 rounded p-2"
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={flexibleStart}
              onChange={(e) => setFlexibleStart(e.target.checked)}
            />
            Flexible start (allow auto-rollover to next available week)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Campaign notes (offer, CTA, dates, goals)"
            className="w-full bg-black text-white border border-gray-600 rounded p-2 min-h-[100px]"
          />
          <p className="text-xs text-gray-400">
            After payment, your request appears in admin advertising queue for
            team review and activation.
          </p>
        </section>

        {/* Confirmation */}
        <section className="text-center">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mr-2"
            />
            I confirm my Sponsor Ad Graphic and campaign duration are correct.
          </label>
        </section>

        <section className="bg-gray-800 p-6 rounded-lg text-left space-y-2">
          <h3 className="text-lg font-semibold text-gold">
            Checkout readiness checklist
          </h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>{campaignDuration ? "✅" : "❌"} Select campaign duration</li>
            <li>
              {hasCreative ? "✅" : "❌"} Add creative file or hosted creative
              URL
            </li>
            <li>{name.trim().length >= 2 ? "✅" : "❌"} Enter contact name</li>
            <li>
              {businessName.trim().length >= 2 ? "✅" : "❌"} Enter business
              name
            </li>
            <li>{hasValidEmail ? "✅" : "❌"} Enter valid email</li>
            <li>
              {confirmed ? "✅" : "❌"} Confirm campaign details are correct
            </li>
          </ul>
          <p className="text-xs text-gray-400 pt-1">
            Review timeline: requests are reviewed, approved campaigns are
            scheduled into weekly capacity, then activated.
          </p>
          <p className="text-xs text-gray-400">
            Need help before payment? Use /support or include escalation notes
            in campaign notes.
          </p>
        </section>

        {/* Proceed Button */}
        <div className="text-center">
          {error ? <p className="text-sm text-red-300 mb-2">{error}</p> : null}
          {!canProceed ? (
            <p className="text-xs text-yellow-300 mb-2">
              Checkout is disabled until all checklist items are complete.
            </p>
          ) : null}
          <button
            onClick={handleProceed}
            disabled={!canProceed || submitting}
            className={`mt-4 px-6 py-2 rounded font-semibold transition ${
              canProceed && !submitting
                ? "bg-gold text-black hover:bg-yellow-400"
                : "bg-gray-600 text-gray-300 cursor-not-allowed"
            }`}
          >
            {submitting ? "Saving Request..." : "Proceed to Checkout"}
          </button>
        </div>

        {/* Note: BuyNow shortcut removed intentionally to prevent pricing/duration mismatches */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Checkout is started from the selected duration above so pricing
            stays accurate.
          </p>
        </div>
      </div>
    </div>
  );
}
