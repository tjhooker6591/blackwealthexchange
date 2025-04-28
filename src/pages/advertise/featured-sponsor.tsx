"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BuyNowButton from "@/components/BuyNowButton";

export default function FeaturedSponsorPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("guest");
  const [adImageFile, setAdImageFile] = useState<File | null>(null);
  const [campaignDuration, setCampaignDuration] = useState<string>("");
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data?.user?._id) {
          setUserId(data.user._id);
        }
      } catch (err) {
        console.error("Failed to fetch user ID", err);
      }
    };

    fetchUser();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAdImageFile(e.target.files[0]);
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
    if (!adImageFile || !campaignDuration || !confirmed) {
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
            Become a Featured Sponsor
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Every Black-owned business is welcome in our free directory — but if you want to 
            <span className="text-gold font-semibold"> stand out</span>, 
            Featured Sponsor Ads give your brand premium visibility across Black Wealth Exchange.
          </p>
          <p className="text-gray-500 mt-4">
            Get highlighted on our homepage, business directory, and key platform pages. 
            Drive more traffic, attract new customers, and show your support for Black economic empowerment.
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
            {[
              { label: "1 Week", value: "14", price: "$25" },
              { label: "2 Weeks", value: "30", price: "$45" },
              { label: "1 Month", value: "60", price: "$80" },
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
            This image will be displayed as your Featured Sponsor Ad across the platform.
          </p>
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
            I confirm my Sponsor Ad Graphic and campaign duration are correct.
          </label>
        </section>

        {/* Proceed Button */}
        <div className="text-center">
          <button
            onClick={handleProceed}
            className={`mt-4 px-6 py-2 rounded font-semibold transition ${
              confirmed && adImageFile && campaignDuration
                ? "bg-gold text-black hover:bg-yellow-400"
                : "bg-gray-600 text-gray-300 cursor-not-allowed"
            }`}
          >
            Proceed to Checkout
          </button>
        </div>

        {/* Instant BuyNow Option */}
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
