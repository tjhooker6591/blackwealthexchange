// pages/premium-finance/module-6.tsx
"use client";

import React from "react";
import Link from "next/link";

const Module6 = () => {
  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <h1 className="text-4xl md:text-5xl font-bold text-gold mb-4 text-center">
        Module 6: Debt Management &amp; Elimination
      </h1>

      <p className="text-gray-300 text-lg max-w-3xl mx-auto text-center mb-4">
        Debt is not a life sentence. This module gives you proven strategies,
        practical tools, and emotional empowerment to eliminate debt and reclaim
        your peace of mind.
      </p>

      <p className="text-gray-400 text-sm text-center mb-8">
        <strong>Featured Video:</strong> Anthony O’Neal: <em>If You’re Living
        Paycheck to Paycheck…</em>
        <br />
        <strong>Why:</strong> Anthony shares no‑nonsense steps to break the
        cycle of debt and build a real financial future.
      </p>

      {/* 🎥 Video */}
      <div className="aspect-w-16 aspect-h-9 mb-8 max-w-4xl mx-auto">
        <iframe
          className="w-full h-full rounded-lg"
          src="https://www.youtube.com/embed/nJI_roT9Vxk"
          title="Debt Elimination - Anthony O'Neal"
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
            Understand the financial and emotional weight of debt—and how to
            break free.
          </li>
          <li>
            Pick your method: Snowball (smallest first) or Avalanche (highest
            interest first).
          </li>
          <li>
            Learn to negotiate down your debt using proven script strategies.
          </li>
          <li>
            Recognize debt traps: payday loans, unnecessary balance transfers,
            and scams.
          </li>
          <li>
            Refocus your mindset: this isn’t punishment—it’s a freedom strategy.
          </li>
        </ul>
      </section>

      {/* 📥 Toolkit */}
      <section className="bg-gray-800 p-6 rounded-lg shadow-md max-w-4xl mx-auto mb-6">
        <h2 className="text-2xl text-gold font-semibold mb-4">
          📥 Eliminate Debt Toolkit:
        </h2>
        <ul className="list-disc text-gray-300 pl-6 space-y-3">
          <li>
            <a
              href="/downloads/debt-elimination-planner.pdf"
              className="text-gold underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Debt Elimination Planner
            </a>{" "}
            – Strategy worksheets, timeline, and payoff visualizer.
          </li>
          <li>
            <a
              href="/downloads/debt-payoff-calculator.xlsx"
              className="text-gold underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Debt Payoff Calculator
            </a>{" "}
            – Simulate pay‑down and savings based on your plan.
          </li>
          <li>
            <a
              href="/downloads/creditor-negotiation-scripts.pdf"
              className="text-gold underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Negotiation Scripts
            </a>{" "}
            – Use these when calling collectors or lenders.
          </li>
          <li>
            <a
              href="/downloads/debt-scam-redflags.pdf"
              className="text-gold underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Avoiding Debt Traps
            </a>{" "}
            – Recognize and sidestep scams and predatory options.
          </li>
        </ul>
      </section>

      {/* 💬 Mindset */}
      <section className="bg-gray-800 p-6 rounded-lg shadow-md max-w-4xl mx-auto mb-10">
        <h2 className="text-2xl text-gold font-semibold mb-4">
          💬 Mindset Check:
        </h2>
        <p className="text-gray-300 mb-2">
          Debt brings stress, shame, and anxiety. But it’s not a personal
          failure—it’s a solvable challenge.
        </p>
        <p className="text-gray-300">
          Ask yourself: What would freedom from debt <em>feel</em> like?
          Visualize it, write it down, and return to it when motivation dips.
        </p>
      </section>

      {/* 🔁 Navigation */}
      <div className="flex justify-between max-w-4xl mx-auto mt-10">
        <Link
          href="/premium-finance/module-5"
          className="inline-block px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
        >
          ← Back to Module 5
        </Link>

        <Link
          href="/premium-finance/module-7"
          className="inline-block px-4 py-2 bg-gold text-black rounded hover:bg-yellow-500 transition"
        >
          Next: Retirement Planning →
        </Link>
      </div>
    </div>
  );
};

export default Module6;
