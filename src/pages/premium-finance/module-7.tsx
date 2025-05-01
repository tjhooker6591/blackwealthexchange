// pages/premium-finance/module-7.tsx

import React from "react";
import Link from "next/link";

const Module7 = () => {
  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <h1 className="text-4xl md:text-5xl font-bold text-gold mb-4 text-center">
        Module 7: Retirement Planning
      </h1>

      <p className="text-gray-300 text-lg max-w-3xl mx-auto text-center mb-4">
        The best time to start planning for retirement is now. Whether you are
        in your 20s or your 50s, this module will help you understand accounts,
        compounding, and smart strategies to build freedom later.
      </p>

      <p className="text-gray-400 text-sm text-center mb-8">
        <strong>Featured Video:</strong> Retirement Planning with Malik S. Lee,
        CFP®
        <br />
        <strong>Why:</strong> Malik explains retirement strategies through a
        culturally relevant lens — with clarity and expert insight.
      </p>

      {/* 🎥 Embedded Video */}
      <div className="aspect-w-16 aspect-h-9 mb-8 max-w-4xl mx-auto">
        <iframe
          className="w-full h-full rounded-lg"
          src="https://www.youtube.com/embed/RdfdvBRcJws"
          title="Retirement Planning with Malik S. Lee, CFP®"
          allowFullScreen
        ></iframe>
      </div>

      {/* 📘 Key Takeaways */}
      <section className="bg-gray-800 p-6 rounded-lg shadow-md max-w-4xl mx-auto mb-6">
        <h2 className="text-2xl text-gold font-semibold mb-4">
          Key Takeaways:
        </h2>
        <ul className="list-disc text-gray-300 pl-6 space-y-2">
          <li>
            Learn the difference between Roth IRA, Traditional IRA, and 401(k).
          </li>
          <li>Take full advantage of employer matching — it is free money!</li>
          <li>
            Use compound interest and consistency to grow wealth long-term.
          </li>
          <li>
            Know how much you need — and how to calculate your retirement
            number.
          </li>
          <li>
            Understand how investing changes as you age (more conservative
            later).
          </li>
        </ul>
      </section>

      {/* 📥 Tools & Calculators */}
      <section className="bg-gray-800 p-6 rounded-lg shadow-md max-w-4xl mx-auto mb-8">
        <h2 className="text-2xl text-gold font-semibold mb-4">
          📥 Retirement Planning Tools:
        </h2>
        <ul className="list-disc text-gray-300 pl-6 space-y-3">
          <li>
            <a
              href="/downloads/retirement-workbook.pdf"
              className="text-gold underline"
              target="_blank"
            >
              Retirement Planning Workbook
            </a>{" "}
            – Helps set target savings, investment mix, and monthly
            contributions.
          </li>
          <li>
            <a
              href="/downloads/retirement-estimator.xlsx"
              className="text-gold underline"
              target="_blank"
            >
              Retirement Needs Estimator
            </a>{" "}
            – Personalized projections based on age, income, and lifestyle.
          </li>
          <li>
            <a
              href="/downloads/catch-up-strategy-guide.pdf"
              className="text-gold underline"
              target="_blank"
            >
              Late-Starter Catch-Up Guide
            </a>{" "}
            – Tips for starting strong at any age.
          </li>
          <li>
            <a
              href="/downloads/retirement-tax-cheatsheet.pdf"
              className="text-gold underline"
              target="_blank"
            >
              Tax Advantage Cheatsheet
            </a>{" "}
            – How to use IRAs and 401(k)s to reduce your taxes today and
            tomorrow.
          </li>
        </ul>
      </section>

      {/* 🧠 Bonus Tips */}
      <section className="bg-gray-800 p-6 rounded-lg shadow-md max-w-4xl mx-auto mb-10">
        <h2 className="text-2xl text-gold font-semibold mb-4">
          🧠 What To Do By Age Group:
        </h2>
        <ul className="list-disc text-gray-300 pl-6 space-y-2">
          <li>
            <strong>In your 20s:</strong> Start small, build consistency, take
            full risks with index funds.
          </li>
          <li>
            <strong>In your 30s:</strong> Increase contributions, start estate
            planning, keep investing aggressively.
          </li>
          <li>
            <strong>In your 40s:</strong> Focus on maxing out retirement
            accounts, reduce debt aggressively.
          </li>
          <li>
            <strong>In your 50s:</strong> Consider catch-up contributions and
            start simulating your retirement income needs.
          </li>
        </ul>
      </section>

      {/* 🔁 Navigation */}
      <div className="flex justify-between max-w-4xl mx-auto mt-10">
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
