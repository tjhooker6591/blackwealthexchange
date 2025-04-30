// pages/premium-finance/module-8.tsx

import React from "react";
import Link from "next/link";

const Module8 = () => {
  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <h1 className="text-4xl md:text-5xl font-bold text-gold mb-4 text-center">
        Module 8: Building Legacy & Asset Protection
      </h1>

      <p className="text-gray-300 text-lg max-w-3xl mx-auto text-center mb-10">
        Wealth is not truly powerful unless it lasts. This final module will
        guide you through protecting what you have built, creating generational
        wealth systems, and passing down assets with intention.
      </p>

      {/* 🎥 Video Embed */}
      <div className="relative pb-[56.25%] h-0 mb-8 rounded-lg overflow-hidden max-w-4xl mx-auto">
        <iframe
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
          title="Module 8 Video"
          allowFullScreen
        ></iframe>
      </div>

      {/* 🧱 Key Takeaways */}
      <section className="bg-gray-800 p-6 rounded-lg shadow-md max-w-4xl mx-auto mb-10">
        <h2 className="text-2xl text-gold font-semibold mb-4">
          Key Takeaways:
        </h2>
        <ul className="list-disc text-gray-300 pl-6 space-y-2">
          <li>Why estate planning matters — even if you are not “rich.”</li>
          <li>
            Create a simple will to protect your family and avoid probate.
          </li>
          <li>
            Understand the basics of living trusts, power of attorney, and
            healthcare directives.
          </li>
          <li>Use life insurance as a wealth transfer tool.</li>
          <li>
            Start early conversations with your children about money and values.
          </li>
          <li>
            How to make your legacy more than just money — pass down wisdom,
            business, and purpose.
          </li>
        </ul>
      </section>

      {/* ✅ Final Navigation */}
      <div className="flex justify-between max-w-4xl mx-auto mt-6">
        <Link href="/premium-finance/module-7">
          <button className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition">
            ← Back to Module 7
          </button>
        </Link>
        <Link href="/premium-finance/index">
          <button className="px-4 py-2 bg-gold text-black rounded hover:bg-yellow-500 transition">
            View All Modules →
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Module8;
