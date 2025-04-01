"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function BusinessDirectoryAdPage() {
  const router = useRouter();

  const handleSelectPlan = (plan: string) => {
    router.push(`/checkout?type=directory&plan=${plan}`);
  };

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12 flex flex-col items-center text-center">
      <h1 className="text-4xl font-bold text-gold mb-4">
        Promote Your Business in the Directory
      </h1>

      <p className="text-lg text-gray-400 max-w-2xl mb-10">
        Feature your business at the top of relevant categories in our
        Black-Owned Business Directory. Get seen by thousands of users searching
        for services like yours.
      </p>

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
            title: "Flexible Pricing",
            text: "Choose the plan that fits your goals and budget — monthly or featured.",
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
          <div className="bg-white text-black rounded-xl p-6 shadow-lg flex flex-col justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">Standard Listing</h3>
              <p className="text-sm mb-4">
                Appear in the directory under your selected category. Great for
                visibility and credibility.
              </p>
              <ul className="text-sm list-disc list-inside mb-4">
                <li>Listed for 7 days</li>
                <li>One business category</li>
                <li>Clickable profile</li>
              </ul>
            </div>
            <button
              onClick={() => handleSelectPlan("standard")}
              className="mt-auto px-4 py-2 bg-black text-gold rounded hover:bg-gray-900 transition"
            >
              $25 - Select Plan
            </button>
          </div>

          {/* Featured Listing */}
          <div className="bg-white text-black rounded-xl p-6 shadow-lg flex flex-col justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">Featured Listing</h3>
              <p className="text-sm mb-4">
                Stand out at the top of the directory with a highlighted badge
                and top placement.
              </p>
              <ul className="text-sm list-disc list-inside mb-4">
                <li>Featured for 14 days</li>
                <li>Highlighted background</li>
                <li>Priority category placement</li>
              </ul>
            </div>
            <button
              onClick={() => handleSelectPlan("featured")}
              className="mt-auto px-4 py-2 bg-black text-gold rounded hover:bg-gray-900 transition"
            >
              $50 - Select Plan
            </button>
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
    </div>
  );
}
