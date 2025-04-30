// pages/premium-finance/module-3.tsx

import React from "react";
import Link from "next/link";

const Module3 = () => {
  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <h1 className="text-4xl md:text-5xl font-bold text-gold mb-4 text-center">
        Module 3: Credit Repair & Power
      </h1>

      <p className="text-gray-300 text-lg max-w-3xl mx-auto text-center mb-10">
        Credit is not just a number — it is a tool. In this module, you will learn how to take control of your credit profile, dispute inaccuracies, and build a powerful credit history that opens doors.
      </p>

      {/* 🎥 Video Embed */}
      <div className="relative pb-[56.25%] h-0 mb-8 rounded-lg overflow-hidden max-w-4xl mx-auto">
        <iframe
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
          title="Module 3 Video"
          allowFullScreen
        ></iframe>
      </div>

      {/* 📌 Key Takeaways */}
      <section className="bg-gray-800 p-6 rounded-lg shadow-md max-w-4xl mx-auto mb-10">
        <h2 className="text-2xl text-gold font-semibold mb-4">Key Takeaways:</h2>
        <ul className="list-disc text-gray-300 pl-6 space-y-2">
          <li>Understand the 5 components of your credit score (payment history, utilization, etc.).</li>
          <li>Check your credit reports for free at AnnualCreditReport.com.</li>
          <li>Dispute incorrect items using sample letters (available in this course).</li>
          <li>Use secured credit cards and credit-builder loans to rebuild credit.</li>
          <li>Keep utilization below 30%, pay on time, and avoid closing old accounts.</li>
          <li>Learn how to negotiate with collectors and protect your rights.</li>
        </ul>
      </section>

      {/* 🧭 Navigation */}
      <div className="flex justify-between max-w-4xl mx-auto mt-6">
        <Link href="/premium-finance/module-2">
          <button className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition">
            ← Back to Module 2
          </button>
        </Link>
        <Link href="/premium-finance/module-4">
          <button className="px-4 py-2 bg-gold text-black rounded hover:bg-yellow-500 transition">
            Next: Building Wealth with Investments →
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Module3;
