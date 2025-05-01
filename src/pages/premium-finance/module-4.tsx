// pages/premium-finance/module-4.tsx

import React from "react";
import Link from "next/link";

const Module4 = () => {
  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <h1 className="text-4xl md:text-5xl font-bold text-gold mb-4 text-center">
        Module 4: Building Wealth with Investments
      </h1>

      <p className="text-gray-300 text-lg max-w-3xl mx-auto text-center mb-4">
        You don not need to be rich to invest — just informed. This module
        introduces smart ways to build wealth through stocks, real estate, and
        passive income — even starting with $25/month.
      </p>

      <p className="text-gray-400 text-sm text-center mb-8">
        <strong>Featured Video:</strong> Building Black Wealth: A Beginner is
        Guide to Investing
        <br />
        <strong>Why:</strong> This video breaks down key investing concepts for
        the Black community — in simple, actionable terms.
      </p>

      {/* 🎥 Embedded Video */}
      <div className="aspect-w-16 aspect-h-9 mb-8 max-w-4xl mx-auto">
        <iframe
          className="w-full h-full rounded-lg"
          src="https://www.youtube.com/embed/8mEJc_vFQos"
          title="Beginner's Guide to Investing"
          allowFullScreen
        ></iframe>
      </div>

      {/* 💡 Key Takeaways */}
      <section className="bg-gray-800 p-6 rounded-lg shadow-md max-w-4xl mx-auto mb-6">
        <h2 className="text-2xl text-gold font-semibold mb-4">
          Key Takeaways:
        </h2>
        <ul className="list-disc text-gray-300 pl-6 space-y-2">
          <li>
            Know the difference between assets and liabilities — and why it
            matters.
          </li>
          <li>Use compound interest to make time your best financial ally.</li>
          <li>
            Start with simple, low-risk investments like index funds or ETFs.
          </li>
          <li>
            Understand how real estate can build long-term passive income.
          </li>
          <li>
            Learn the basics of retirement accounts and their tax benefits.
          </li>
          <li>
            Know how to start with just $25/month and scale with confidence.
          </li>
        </ul>
      </section>

      {/* 📥 Downloadable Tools */}
      <section className="bg-gray-800 p-6 rounded-lg shadow-md max-w-4xl mx-auto mb-8">
        <h2 className="text-2xl text-gold font-semibold mb-4">
          📥 Starter Investment Tools:
        </h2>
        <ul className="list-disc text-gray-300 pl-6 space-y-3">
          <li>
            <a
              href="/downloads/investment-planner-template.pdf"
              className="text-gold underline"
              target="_blank"
            >
              Investment Planning Template
            </a>{" "}
            – Match goals with assets and risk level.
          </li>
          <li>
            <a
              href="/downloads/investing-starter-pack.pdf"
              className="text-gold underline"
              target="_blank"
            >
              Beginner is Investment Starter Pack
            </a>{" "}
            – Quick definitions, examples, and how to get started.
          </li>
          <li>
            <a
              href="/downloads/compound-growth-calculator.xlsx"
              className="text-gold underline"
              target="_blank"
            >
              $25/Month Growth Calculator
            </a>{" "}
            – See how small investments grow over time.
          </li>
        </ul>
      </section>

      {/* 🧠 Extra Insight */}
      <section className="bg-gray-800 p-6 rounded-lg shadow-md max-w-4xl mx-auto mb-10">
        <h2 className="text-2xl text-gold font-semibold mb-4">🧠 Try This:</h2>
        <p className="text-gray-300 mb-2">
          Want to test your investing readiness? Take this quick 3-question
          quiz:
        </p>
        <ul className="list-decimal text-gray-300 pl-6 space-y-2">
          <li>Do I understand what a brokerage account is?</li>
          <li>Do I know how to compare an index fund vs. a stock?</li>
          <li>Am I investing money I can leave alone for 5+ years?</li>
        </ul>
        <p className="text-gray-400 mt-2">
          If not, go back and review the downloadable pack above to fill in any
          knowledge gaps.
        </p>
      </section>

      {/* 🔁 Navigation */}
      <div className="flex justify-between max-w-4xl mx-auto mt-10">
        <Link href="/premium-finance/module-3">
          <button className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition">
            ← Back to Module 3
          </button>
        </Link>
        <Link href="/premium-finance/module-5">
          <button className="px-4 py-2 bg-gold text-black rounded hover:bg-yellow-500 transition">
            Next: Side Hustles & Business Basics →
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Module4;
