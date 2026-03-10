// src/pages/advertise/featured-sponsor.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/router";

export default function FeaturedSponsorPage() {
  const router = useRouter();
  const [adImageFile, setAdImageFile] = useState<File | null>(null);
  const [campaignDuration, setCampaignDuration] = useState<string>("");
  const [confirmed, setConfirmed] = useState(false);
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAdImageFile(e.target.files[0]);
    }
  };

  const canProceed = useMemo(() => {
    return (
      Boolean(campaignDuration) &&
      confirmed &&
      name.trim().length >= 2 &&
      businessName.trim().length >= 2 &&
      /^\S+@\S+\.\S+$/.test(email.trim())
    );
  }, [campaignDuration, confirmed, name, businessName, email]);

  const handleProceed = async () => {
    setError("");
    if (!canProceed) {
      setError("Please complete the campaign details and confirm before checkout.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name,
        email,
        businessName,
        adText: notes || "Featured sponsor campaign request",
        adImage: adImageFile?.name || "",
        website,
        budget: campaignDuration === "7" ? "25" : campaignDuration === "14" ? "45" : "80",
        option: "featured-sponsor",
        durationDays: Number(campaignDuration),
        placement: "homepage-feature",
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
      const query = new URLSearchParams({
        option: "featured-sponsor",
        duration: campaignDuration,
      });
      if (requestId) query.set("campaignId", requestId);
      query.set("placement", "homepage-feature");

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
            Featured Sponsor Ads give your brand premium visibility across Black
            Wealth Exchange.
          </p>
          <p className="text-gray-500 mt-4">
            Get highlighted on our homepage, business directory, and key
            platform pages. Drive more traffic, attract new customers, and show
            your support for Black economic empowerment.
          </p>
        </section>

        {/* Limited Slots Info */}
        <section className="bg-gray-800 p-6 rounded-lg shadow text-left mt-10">
          <h2 className="text-2xl font-bold text-gold mb-4">
            Limited Availability: Weekly Sponsor Slots
          </h2>
          <p className="text-gray-300 mb-4">
            Your business will appear in the{" "}
            <strong>rolling Featured Sponsor section</strong> on the homepage —
            shown to every visitor on the site. Each campaign runs for{" "}
            <strong>7 days</strong> with
            <strong> only 8 sponsor slots</strong> available per week.
          </p>
          <p className="text-gray-300 mb-4">
            With <strong>52 total weekly rotations per year</strong>, space is
            limited and demand is high. Once a week is full, your ad will
            automatically be queued for the next available slot.
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
              text: "Your brand will be placed at the top of the homepage as a Featured Sponsor.",
            },
            {
              title: "High Visibility",
              text: "Reach thousands of engaged users actively exploring Black-owned brands.",
            },
            {
              title: "Priority Exposure",
              text: "Featured across platform sections, including directory and marketplace banners.",
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
            Choose a duration that fits your campaign needs. All featured
            sponsors receive top billing across key areas.
          </p>
          <div className="flex justify-center gap-6 flex-wrap">
            {[
              { label: "1 Week", value: "7", price: "$25" },
              { label: "2 Weeks", value: "14", price: "$45" },
              { label: "1 Month", value: "30", price: "$80" },
            ].map(({ label, value, price }) => (
              <div
                key={value}
                onClick={() => setCampaignDuration(value)}
                className={`cursor-pointer p-6 rounded-lg border ${
                  campaignDuration === value
                    ? "border-gold bg-gray-800"
                    : "border-gray-600"
                }`}
              >
                <h4 className="text-lg font-semibold text-white">{label}</h4>
                <p className="text-gold">{price}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Upload Sponsor Graphic */}
        <section className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4 text-gold">
            Upload Your Sponsor Ad Graphic
          </h3>
          <p className="text-sm text-gray-400 mb-2">
            This image will be displayed as your Featured Sponsor Ad across the
            platform.
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full bg-black text-white border border-gray-600 rounded p-2"
          />
        </section>

        <section className="bg-gray-800 p-6 rounded-lg space-y-4 text-left">
          <h3 className="text-xl font-semibold text-gold">Campaign Details</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Your name" className="w-full bg-black text-white border border-gray-600 rounded p-2" />
            <input value={businessName} onChange={(e)=>setBusinessName(e.target.value)} placeholder="Business name" className="w-full bg-black text-white border border-gray-600 rounded p-2" />
            <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email" type="email" className="w-full bg-black text-white border border-gray-600 rounded p-2" />
            <input value={website} onChange={(e)=>setWebsite(e.target.value)} placeholder="Website (optional)" className="w-full bg-black text-white border border-gray-600 rounded p-2" />
          </div>
          <textarea value={notes} onChange={(e)=>setNotes(e.target.value)} placeholder="Campaign notes (offer, CTA, dates, goals)" className="w-full bg-black text-white border border-gray-600 rounded p-2 min-h-[100px]" />
          <p className="text-xs text-gray-400">After payment, your request appears in admin advertising queue for team review and activation.</p>
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

        {/* Proceed Button */}
        <div className="text-center">
          {error ? <p className="text-sm text-red-300 mb-2">{error}</p> : null}
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
