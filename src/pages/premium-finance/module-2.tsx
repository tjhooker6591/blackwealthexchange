// pages/premium-finance/module-2.tsx

import React from "react";
import Link from "next/link";

const Module2 = () => {
  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <h1 className="text-4xl md:text-5xl font-bold text-gold mb-4 text-center">
        Module 2: Budgeting for Real Life
      </h1>

      <p className="text-gray-300 text-lg max-w-3xl mx-auto text-center mb-10">
        Budgeting is not about restriction — its about freedom. In this module, we walk through how to build a flexible, realistic budget that works for your life, not against it.
      </p>

      {/* 📺 Video Section */}
      <div className="relative pb-[56.25%] h-0 mb-8 rounded-lg overflow-hidden max-w-4xl mx-auto">
        <iframe
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
          title="Module 2 Video"
          allowFullScreen
        ></iframe>
      </div>

      {/* 💡 Key Takeaways */}
      <section className="bg-gray-800 p-6 rounded-lg shadow-md max-w-4xl mx-auto mb-10">
        <h2 className="text-2xl text-gold font-semibold mb-4">Key Takeaways:</h2>
        <ul className="list-disc text-gray-300 pl-6 space-y-2">
          <li>Create a monthly budget using fixed income and essential expenses.</li>
          <li>Set short-term and long-term financial goals (e.g. savings, debt payoff, home ownership).</li>
          <li>Track spending habits to identify leaks and overspending patterns.</li>
          <li>Use the 50/30/20 rule (Needs / Wants / Savings) as a budgeting baseline.</li>
          <li>Learn how to build and maintain an emergency fund.</li>
        </ul>
      </section>

      {/* 🔁 Navigation */}
      <div className="flex justify-between max-w-4xl mx-auto mt-6">
        <Link href="/premium-finance/module-1">
          <button className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition">
            ← Back to Module 1
          </button>
        </Link>
        <Link href="/premium-finance/module-3">
          <button className="px-4 py-2 bg-gold text-black rounded hover:bg-yellow-500 transition">
            Next: Credit Repair & Power →
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Module2;
