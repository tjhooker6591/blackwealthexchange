// pages/premium-finance/module-6.tsx

import React from "react";
import Link from "next/link";

const Module6 = () => {
  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <h1 className="text-4xl md:text-5xl font-bold text-gold mb-4 text-center">
        Module 6: Debt Management & Elimination
      </h1>

      <p className="text-gray-300 text-lg max-w-3xl mx-auto text-center mb-10">
        Debt is not a life sentence. In this module, we will help you create a real plan to pay off your debt, avoid traps, and start building financial freedom one step at a time.
      </p>

      {/* 🎥 Video Embed */}
      <div className="relative pb-[56.25%] h-0 mb-8 rounded-lg overflow-hidden max-w-4xl mx-auto">
        <iframe
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
          title="Module 6 Video"
          allowFullScreen
        ></iframe>
      </div>

      {/* 📌 Key Takeaways */}
      <section className="bg-gray-800 p-6 rounded-lg shadow-md max-w-4xl mx-auto mb-10">
        <h2 className="text-2xl text-gold font-semibold mb-4">Key Takeaways:</h2>
        <ul className="list-disc text-gray-300 pl-6 space-y-2">
          <li>Understand the real cost of high-interest debt and how it affects your future.</li>
          <li>Choose your strategy: the Snowball Method (smallest debt first) or Avalanche Method (highest interest first).</li>
          <li>Create a debt repayment timeline and monthly tracker.</li>
          <li>Explore debt consolidation and refinancing options (carefully).</li>
          <li>Negotiate with creditors and collection agencies — you have more power than you think.</li>
          <li>Use freed-up income to shift toward savings and investments.</li>
        </ul>
      </section>

      {/* 🔁 Navigation */}
      <div className="flex justify-between max-w-4xl mx-auto mt-6">
        <Link href="/premium-finance/module-5">
          <button className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition">
            ← Back to Module 5
          </button>
        </Link>
        <Link href="/premium-finance/module-7">
          <button className="px-4 py-2 bg-gold text-black rounded hover:bg-yellow-500 transition">
            Next: Retirement Planning →
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Module6;
