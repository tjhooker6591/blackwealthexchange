// pages/premium-finance/module-5.tsx
"use client";

import React from "react";
import Link from "next/link";

const Module5 = () => {
  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <h1 className="text-4xl md:text-5xl font-bold text-gold mb-4 text-center">
        Module 5: Side Hustles &amp; Business Basics
      </h1>

      <p className="text-gray-300 text-lg max-w-3xl mx-auto text-center mb-4">
        A side hustle can fund your freedom. This module gives you the blueprint
        to turn your ideas into income—with steps for business setup,
        credit‑building, and digital presence.
      </p>

      <p className="text-gray-400 text-sm text-center mb-8">
        <strong>Featured Video:</strong> The Side Hustle Revolution&nbsp;| Nicaila
        Matthews Okome
        <br />
        <strong>Why:</strong> Learn how everyday skills become scalable income
        streams. Nicaila’s story is proof that purpose pays.
      </p>

      {/* 🎥 Video */}
      <div className="aspect-w-16 aspect-h-9 mb-8 max-w-4xl mx-auto">
        <iframe
          className="w-full h-full rounded-lg"
          src="https://www.youtube.com/embed/gUFiD9bknsU"
          title="The Side Hustle Revolution | Nicaila Matthews Okome | TED Business"
          allowFullScreen
        ></iframe>
      </div>

      {/* 🧠 Key Takeaways */}
      <section className="bg-gray-800 p-6 rounded-lg shadow-md max-w-4xl mx-auto mb-6">
        <h2 className="text-2xl text-gold font-semibold mb-4">
          Key Takeaways:
        </h2>
        <ul className="list-disc text-gray-300 pl-6 space-y-2">
          <li>Start with a simple idea that solves a problem or offers joy.</li>
          <li>
            Choose the right legal structure for your hustle: LLC, Sole
            Proprietor, etc.
          </li>
          <li>Create a strong brand presence—even on a budget.</li>
          <li>
            Open a business bank account and apply for your free EIN from
            IRS.gov.
          </li>
          <li>
            Build business credit: Start with vendor accounts like Uline or
            Quill.
          </li>
          <li>Use hustle income to fuel long‑term wealth‑building strategies.</li>
        </ul>
      </section>

      {/* 📥 Downloads */}
      <section className="bg-gray-800 p-6 rounded-lg shadow-md max-w-4xl mx-auto mb-6">
        <h2 className="text-2xl text-gold font-semibold mb-4">
          📥 Hustle Starter Toolkit:
        </h2>
        <ul className="list-disc text-gray-300 pl-6 space-y-3">
          <li>
            <a
              href="/downloads/side-hustle-business-planner.pdf"
              className="text-gold underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Side Hustle Business Planner
            </a>{" "}
            – From idea to launch on a tight budget.
          </li>
          <li>
            <a
              href="/downloads/business-formation-guide.pdf"
              className="text-gold underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Business Formation Step‑by‑Step
            </a>{" "}
            – EIN, structure types, bank account setup.
          </li>
          <li>
            <a
              href="/downloads/online-tools-for-entrepreneurs.pdf"
              className="text-gold underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Best Free &amp; Paid Online Tools
            </a>{" "}
            – Invoicing, design, domains, CRM, payments, etc.
          </li>
          <li>
            <a
              href="/downloads/business-credit-tracker.xlsx"
              className="text-gold underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Business Credit Builder &amp; Tracker
            </a>{" "}
            – Track Net‑30 vendors, credit limits, reporting bureaus.
          </li>
        </ul>
      </section>

      {/* 💡 Action Plan */}
      <section className="bg-gray-800 p-6 rounded-lg shadow-md max-w-4xl mx-auto mb-10">
        <h2 className="text-2xl text-gold font-semibold mb-4">💡 Action Plan:</h2>
        <ol className="list-decimal text-gray-300 pl-6 space-y-2">
          <li>Write 3 side‑hustle ideas that use your current skills.</li>
          <li>
            Pick one and use the Business Planner to map your MVP (minimum
            viable product).
          </li>
          <li>Register for an EIN and open a free business checking account.</li>
          <li>
            Launch your hustle with just one offer or product—keep it simple!
          </li>
          <li>Track expenses and use profits to invest, save, or expand.</li>
        </ol>
      </section>

      {/* 🔁 Navigation */}
      <div className="flex justify-between max-w-4xl mx-auto mt-10">
        <Link
          href="/premium-finance/module-4"
          className="inline-block px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
        >
          ← Back to Module 4
        </Link>

        <Link
          href="/premium-finance/module-6"
          className="inline-block px-4 py-2 bg-gold text-black rounded hover:bg-yellow-500 transition"
        >
          Next: Debt Management &amp; Elimination →
        </Link>
      </div>
    </div>
  );
};

export default Module5;
