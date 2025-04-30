// pages/premium-finance/module-7.tsx

import React from "react";
import Link from "next/link";

const Module7 = () => {
  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <h1 className="text-4xl md:text-5xl font-bold text-gold mb-4 text-center">
        Module 7: Retirement Planning
      </h1>

      <p className="text-gray-300 text-lg max-w-3xl mx-auto text-center mb-10">
        The best time to start planning for retirement is now. Whether you are in your 20s or your 50s, this module will help you understand retirement accounts, investment strategies, and long-term planning to build peace of mind and future freedom.
      </p>

      {/* 🎥 Video Embed */}
      <div className="relative pb-[56.25%] h-0 mb-8 rounded-lg overflow-hidden max-w-4xl mx-auto">
        <iframe
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
          title="Module 7 Video"
          allowFullScreen
        ></iframe>
      </div>

      {/* 📘 Key Takeaways */}
      <section className="bg-gray-800 p-6 rounded-lg shadow-md max-w-4xl mx-auto mb-10">
        <h2 className="text-2xl text-gold font-semibold mb-4">Key Takeaways:</h2>
        <ul className="list-disc text-gray-300 pl-6 space-y-2">
          <li>Learn about 401(k), Roth IRA, Traditional IRA, and other retirement accounts.</li>
          <li>Understand employer matching and how to take full advantage of it.</li>
          <li>Discover how compound interest works over time — and why starting early matters.</li>
          <li>Even late starters can build wealth: see how to catch up with aggressive saving.</li>
          <li>Diversify investments for long-term growth (stocks, bonds, index funds).</li>
          <li>Create a retirement income plan and estimate how much you will need.</li>
        </ul>
      </section>

      {/* 🔁 Navigation */}
      <div className="flex justify-between max-w-4xl mx-auto mt-6">
        <Link href="/premium-finance/module-6">
          <button className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition">
            ← Back to Module 6
          </button>
        </Link>
        <Link href="/premium-finance/module-8">
          <button className="px-4 py-2 bg-gold text-black rounded hover:bg-yellow-500 transition">
            Next: Legacy & Asset Protection →
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Module7;
