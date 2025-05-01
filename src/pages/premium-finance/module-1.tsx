// pages/premium-finance/module-1.tsx

import React from "react";
import Link from "next/link";

const Module1 = () => {
  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <h1 className="text-4xl md:text-5xl font-bold text-gold mb-4 text-center">
        Module 1: Breaking Financial Myths
      </h1>

      <p className="text-gray-300 text-lg max-w-3xl mx-auto text-center mb-4">
        Begin your journey by challenging the lies we have been taught about
        money. This module focuses on mindset, self-worth, and recognizing the
        systems designed to keep us from wealth.
      </p>

      <p className="text-gray-400 text-sm text-center mb-8">
        <strong>Featured Video:</strong> Financial Literacy is the Civil Rights
        Issue of our Generation
        <br />
        <strong>Why:</strong> This video explores systemic challenges and the
        mindset shift required to reclaim economic power.
      </p>

      {/* 🎥 Video */}
      <div className="aspect-w-16 aspect-h-9 mb-8 max-w-4xl mx-auto">
        <iframe
          className="w-full h-full rounded-lg"
          src="https://www.youtube.com/embed/aln7V6zN0pw"
          title="Myth Buster: Financial Literacy is the Civil Rights Issue"
          allowFullScreen
        ></iframe>
      </div>

      {/* ✅ Key Takeaways */}
      <section className="bg-gray-800 p-6 rounded-lg shadow-md max-w-4xl mx-auto mb-8">
        <h2 className="text-2xl text-gold font-semibold mb-4">
          Key Takeaways:
        </h2>
        <ul className="list-disc text-gray-300 pl-6 space-y-2">
          <li>
            Understand the historical forces that excluded Black families from
            wealth-building tools.
          </li>
          <li>
            Identify common financial myths such as debt is always bad or
            investing is only for the rich.
          </li>
          <li>
            Recognize how financial shame and silence can be tools of economic
            control.
          </li>
          <li>Reclaim your financial story with confidence and clarity.</li>
        </ul>
      </section>

      {/* 📥 Downloads */}
      <section className="bg-gray-800 p-6 rounded-lg shadow-md max-w-4xl mx-auto mb-8">
        <h2 className="text-2xl text-gold font-semibold mb-4">
          📥 Downloads & Tools:
        </h2>
        <ul className="list-disc text-gray-300 pl-6 space-y-3">
          <li>
            <a
              href="/downloads/module1-myth-breaker-workbook.pdf"
              className="text-gold underline"
              target="_blank"
            >
              Myth Breaker Worksheet (PDF)
            </a>{" "}
            – Identify and challenge 5 money beliefs holding you back.
          </li>
          <li>
            <a
              href="/downloads/black-financial-history-timeline.pdf"
              className="text-gold underline"
              target="_blank"
            >
              Black Financial History Timeline
            </a>{" "}
            – A printable visual showing 400+ years of economic barriers.
          </li>
          <li>
            <a
              href="/downloads/module1-reflection-journal.pdf"
              className="text-gold underline"
              target="_blank"
            >
              Reflection Journal Prompts
            </a>{" "}
            – Unpack how money was talked about (or not) in your household.
          </li>
        </ul>
      </section>

      {/* 💬 Bonus Prompt */}
      <section className="bg-gray-800 p-6 rounded-lg shadow-md max-w-4xl mx-auto mb-10">
        <h2 className="text-2xl text-gold font-semibold mb-4">
          🧠 Reflect & Apply:
        </h2>
        <p className="text-gray-300 mb-2">
          Think about your earliest money memory. What belief did it leave you
          with? Write it down. Now ask:
        </p>
        <ul className="list-disc text-gray-300 pl-6 space-y-2">
          <li>Is that belief true?</li>
          <li>Is it serving your goals?</li>
          <li>Can you replace it with a more empowering truth?</li>
        </ul>
      </section>

      {/* 🔁 Navigation */}
      <div className="flex justify-between max-w-4xl mx-auto mt-10">
        <Link href="/premium-finance/index">
          <button className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition">
            ← Back to Modules
          </button>
        </Link>
        <Link href="/premium-finance/module-2">
          <button className="px-4 py-2 bg-gold text-black rounded hover:bg-yellow-500 transition">
            Next: Budgeting for Real Life →
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Module1;
