"use client";

import React, { useState } from "react";
import { useRouter } from "next/router";

export default function FeaturedSponsorPage() {
  const router = useRouter();
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [campaignDuration, setCampaignDuration] = useState<string>("");
  const [confirmed, setConfirmed] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBannerFile(e.target.files[0]);
    }
  };

  const handleProceed = () => {
    if (!bannerFile || !campaignDuration || !confirmed) {
      alert(
        "Please upload a banner, enter the campaign duration, and confirm your details before proceeding.",
      );
      return;
    }

    router.push(
      `/advertising/checkout?option=featured-sponsor&duration=${encodeURIComponent(
        campaignDuration,
      )}`,
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-2xl mx-auto bg-gray-800 p-6 rounded-lg border border-gold">
        <h1 className="text-2xl font-bold text-gold mb-4">
          Featured Sponsor Advertising
        </h1>
        <p className="text-gray-300 mb-6">
          Boost your brand by being prominently featured on our homepage and
          throughout the platform. Perfect for high-visibility campaigns and
          brand awareness.
        </p>

        <div className="mb-4">
          <label className="block text-sm mb-1">Upload Your Banner</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm mb-1">
            Campaign Duration (in days)
          </label>
          <input
            type="number"
            value={campaignDuration}
            onChange={(e) => setCampaignDuration(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 border border-gray-600"
            placeholder="e.g. 14"
          />
        </div>

        <div className="mb-4">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mr-2"
            />
            I confirm that my banner and duration details are correct.
          </label>
        </div>

        <button
          onClick={handleProceed}
          className={`w-full py-2 px-4 rounded text-black font-semibold transition ${
            confirmed && bannerFile && campaignDuration
              ? "bg-gold hover:bg-yellow-500"
              : "bg-gray-500 cursor-not-allowed"
          }`}
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}
