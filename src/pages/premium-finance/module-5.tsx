// pages/premium-finance/module-5.tsx

import React from "react";
import Link from "next/link";

const Module5 = () => {
  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <h1 className="text-4xl md:text-5xl font-bold text-gold mb-4 text-center">
        Module 5: Side Hustles & Business Basics
      </h1>

      <p className="text-gray-300 text-lg max-w-3xl mx-auto text-center mb-10">
        A side hustle can fund your freedom. In this module, we will break down how to start earning extra income, build business credit, and eventually transition into full entrepreneurship — even with limited resources.
      </p>

      {/* 🎥 Video Embed */}
      <div className="relative pb-[56.25%] h-0 mb-8 rounded-lg overflow-hidden max-w-4xl mx-auto">
        <iframe
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
          title="Module 5 Video"
          allowFullScreen
        ></iframe>
      </div>

      {/* 🧠 Key Takeaways */}
      <section className="bg-gray-800 p-6 rounded-lg shadow-md max-w-4xl mx-auto mb-10">
        <h2 className="text-2xl text-gold font-semibold mb-4">Key Takeaways:</h2>
        <ul className="list-disc text-gray-300 pl-6 space-y-2">
          <li>Identify your profitable skills or passions and turn them into services or products.</li>
          <li>Understand the difference between a sole proprietorship, LLC, and S-Corp.</li>
          <li>Learn how to register your business legally and get an EIN for free.</li>
          <li>Build a professional online presence for your hustle (website, social, payment tools).</li>
          <li>Start building business credit using vendors, net-30 accounts, and responsible lending.</li>
          <li>Use income from your side hustle to fund investments, pay down debt, or grow operations.</li>
        </ul>
      </section>

      {/* 🔁 Navigation */}
      <div className="flex justify-between max-w-4xl mx-auto mt-6">
        <Link href="/premium-finance/module-4">
          <button className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition">
            ← Back to Module 4
          </button>
        </Link>
        <Link href="/premium-finance/module-6">
          <button className="px-4 py-2 bg-gold text-black rounded hover:bg-yellow-500 transition">
            Next: Debt Management & Elimination →
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Module5;
