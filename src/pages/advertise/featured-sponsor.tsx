"use client";

import React, { useState } from "react";
import { useRouter } from "next/router";
import BuyNowButton from "@/components/BuyNowButton";
import { useSession } from "next-auth/react";

export default function FeaturedSponsorPage() {
  const router = useRouter();
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [campaignDuration, setCampaignDuration] = useState<string>("");
  const [confirmed, setConfirmed] = useState(false);
  const { data: session } = useSession();
  const userId = session?.user?.id || "guest";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBannerFile(e.target.files[0]);
    }
  };

  const getAmount = () => {
    switch (campaignDuration) {
      case "14":
        return 25;
      case "30":
        return 45;
      case "60":
        return 80;
      default:
        return 0;
    }
  };

  const handleProceed = () => {
    if (!bannerFile || !campaignDuration || !confirmed) {
      alert("Please complete all fields before proceeding.");
      return;
    }

    router.push(
      `/advertising/checkout?option=featured-sponsor&duration=${campaignDuration}`,
    );
  };

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <section className="text-center">
          <h1 className="text-4xl font-bold text-gold mb-4">
            Featured Sponsor Advertising
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Want to maximize your visibility? Get your brand front and center on
            our homepage and key platform pages. Perfect for campaigns that need
            attention.
          </p>
        </section>

        {/* NEW: Limited Slots Info */}
        <section className="bg-gray-800 p-6 rounded-lg shadow text-left mt-10">
          <h2 className="text-2xl font-bold text-gold mb-4">
            Limited Availability: Weekly Sponsor Slots
          </h2>
          <p className="text-gray-300 mb-4">
            Your business will appear in the{" "}
            <strong>rolling Featured Sponsor section</strong> on the homepage —
            shown to every visitor on the site. Each campaign runs for{" "}
            <strong>7 days</strong> with <strong>only 8 sponsor slots</strong>{" "}
            available per week.
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
            <div
              onClick={() => setCampaignDuration("14")}
              className={`cursor-pointer p-6 rounded-lg border ${
                campaignDuration === "14"
                  ? "border-gold bg-gray-800"
                  : "border-gray-600"
              }`}
            >
              <h4 className="text-lg font-semibold text-white">1 Week</h4>
              <p className="text-gold">$25</p>
            </div>
            <div
              onClick={() => setCampaignDuration("30")}
              className={`cursor-pointer p-6 rounded-lg border ${
                campaignDuration === "30"
                  ? "border-gold bg-gray-800"
                  : "border-gray-600"
              }`}
            >
              <h4 className="text-lg font-semibold text-white">2 Weeks</h4>
              <p className="text-gold">$45</p>
            </div>
            <div
              onClick={() => setCampaignDuration("60")}
              className={`cursor-pointer p-6 rounded-lg border ${
                campaignDuration === "60"
                  ? "border-gold bg-gray-800"
                  : "border-gray-600"
              }`}
            >
              <h4 className="text-lg font-semibold text-white">1 Month</h4>
              <p className="text-gold">$80</p>
            </div>
          </div>
        </section>

        {/* Upload Section */}
        <section className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4 text-gold">
            Upload Your Banner
          </h3>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full bg-black text-white border border-gray-600 rounded p-2"
          />
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
            I confirm my banner and campaign duration are correct.
          </label>
        </section>

        {/* Proceed Button */}
        <div className="text-center">
          <button
            onClick={handleProceed}
            className={`mt-4 px-6 py-2 rounded font-semibold transition ${
              confirmed && bannerFile && campaignDuration
                ? "bg-gold text-black hover:bg-yellow-400"
                : "bg-gray-600 text-gray-300 cursor-not-allowed"
            }`}
          >
            Proceed to Checkout
          </button>
        </div>

        {/* Optional Instant BuyNow */}
        <div className="text-center mt-10">
          <p className="text-sm text-gray-400 mb-2">
            Or skip the setup and go straight to checkout:
          </p>
          <BuyNowButton
            userId={userId}
            itemId="featured-sponsor-ad"
            type="ad"
            amount={getAmount()}
          />
        </div>
      </div>
    </div>
  );
}
