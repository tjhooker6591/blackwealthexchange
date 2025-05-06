// pages/premium-finance/module-3.tsx
"use client";

import React from "react";
import Link from "next/link";

const Module3 = () => {
  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <h1 className="text-4xl md:text-5xl font-bold text-gold mb-4 text-center">
        Module&nbsp;3: Credit Repair &amp; Power
      </h1>

      <p className="text-gray-300 text-lg max-w-3xl mx-auto text-center mb-4">
        Credit is not just a number—it is a tool. Learn how to fix errors, build
        your credit profile, and unlock access to better financial
        opportunities.
      </p>

      <p className="text-gray-400 text-sm text-center mb-8">
        <strong>Featured Video:</strong> Credit Score Secrets with Dominique
        Brown
        <br />
        <strong>Why:</strong> Dominique breaks down credit strategy in a
        relatable, step‑by‑step way. A must‑watch for rebuilding and taking
        control.
      </p>

      {/* 🎥 Embedded Video */}
      <div className="aspect-w-16 aspect-h-9 mb-8 max-w-4xl mx-auto">
        <iframe
          className="w-full h-full rounded-lg"
          src="https://www.youtube.com/embed/l3hAqa1OAP8"
          title="Credit Score Secrets"
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
            Understand the five components of your credit score and how to
            influence them.
          </li>
          <li>
            Check your credit reports regularly—and how to spot and dispute
            errors.
          </li>
          <li>
            Use tools like secured cards and credit‑builder loans to rebuild
            wisely.
          </li>
          <li>
            Keep utilization below 30 %, pay early, and automate to protect your
            history.
          </li>
          <li>
            Do not fear collectors—learn your rights and how to negotiate
            legally.
          </li>
        </ul>
      </section>

      {/* 📥 Downloads */}
      <section className="bg-gray-800 p-6 rounded-lg shadow-md max-w-4xl mx-auto mb-6">
        <h2 className="text-2xl text-gold font-semibold mb-4">
          📥 Credit Repair Kit:
        </h2>
        <ul className="list-disc text-gray-300 pl-6 space-y-3">
          <li>
            <a
              href="/downloads/credit-dispute-letter-template.pdf"
              className="text-gold underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Dispute Letter Templates (PDF)
            </a>{" "}
            – Includes late payment, collection, and inquiry dispute samples.
          </li>
          <li>
            <a
              href="/downloads/credit-score-tracker.xlsx"
              className="text-gold underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Credit Score Tracker (Excel)
            </a>{" "}
            – Track your score over time with built‑in goal setting.
          </li>
          <li>
            <a
              href="/downloads/reading-your-credit-report-guide.pdf"
              className="text-gold underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              How to Read Your Credit Report
            </a>{" "}
            – Walkthrough guide with red flags and sample reports.
          </li>
        </ul>
      </section>

      {/* 💪 Mini Challenge */}
      <section className="bg-gray-800 p-6 rounded-lg shadow-md max-w-4xl mx-auto mb-10">
        <h2 className="text-2xl text-gold font-semibold mb-4">
          🔍 Credit Health Challenge:
        </h2>
        <p className="text-gray-300 mb-2">
          Go to{" "}
          <a
            href="https://www.annualcreditreport.com"
            className="underline text-gold"
            target="_blank"
            rel="noopener noreferrer"
          >
            AnnualCreditReport.com
          </a>{" "}
          and pull your report. Then:
        </p>
        <ul className="list-disc text-gray-300 pl-6 space-y-2">
          <li>
            Highlight one positive and one negative item on each bureau report.
          </li>
          <li>Use the “How to Read Your Report” guide to decode key items.</li>
          <li>
            Complete and send one dispute letter (if needed) from the templates
            provided.
          </li>
        </ul>
      </section>

      {/* 🔁 Navigation */}
      <div className="flex justify-between max-w-4xl mx-auto mt-10">
        <Link
          href="/premium-finance/module-2"
          className="inline-block px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
        >
          ← Back to Module 2
        </Link>

        <Link
          href="/premium-finance/module-4"
          className="inline-block px-4 py-2 bg-gold text-black rounded hover:bg-yellow-500 transition"
        >
          Next: Building Wealth with Investments →
        </Link>
      </div>
    </div>
  );
};

export default Module3;
