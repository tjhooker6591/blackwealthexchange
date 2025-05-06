// pages/premium-finance/module-8.tsx
"use client";

import React from "react";
import Link from "next/link";

const Module8 = () => {
  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <h1 className="text-4xl md:text-5xl font-bold text-gold mb-4 text-center">
        Module 8: Building Legacy &amp; Asset Protection
      </h1>

      <p className="text-gray-300 text-lg max-w-3xl mx-auto text-center mb-4">
        Wealth is not truly powerful unless it lasts. This final module helps
        you protect what you’ve built legally, pass it on, and embed your values
        into your family’s financial future.
      </p>

      <p className="text-gray-400 text-sm text-center mb-8">
        <strong>Featured Video:</strong> Estate Planning &amp; Closing the
        Wealth Gap (PBS)
        <br />
        <strong>Why:</strong> This expert panel offers a powerful breakdown of
        how estate planning can close the racial wealth gap—and what steps to
        take now.
      </p>

      {/* 🎥 Video */}
      <div className="aspect-w-16 aspect-h-9 mb-8 max-w-4xl mx-auto">
        <iframe
          className="w-full h-full rounded-lg"
          src="https://www.youtube.com/embed/g3R2owzST6M"
          title="Closing the Racial Wealth Gap"
          allowFullScreen
        ></iframe>
      </div>

      {/* 🧱 Key Takeaways */}
      <section className="bg-gray-800 p-6 rounded-lg shadow-md max-w-4xl mx-auto mb-6">
        <h2 className="text-2xl text-gold font-semibold mb-4">Key Takeaways</h2>
        <ul className="list-disc text-gray-300 pl-6 space-y-2">
          <li>Learn the difference between a will and a living trust.</li>
          <li>
            Protect your legacy with healthcare directives and power of
            attorney.
          </li>
          <li>
            Understand probate and how to avoid it through proper documentation.
          </li>
          <li>
            Minimize estate taxes so beneficiaries receive assets without delay.
          </li>
          <li>
            Write a legacy letter—your values matter just as much as valuables.
          </li>
          <li>
            Prepare your family to carry the torch through education and
            planning.
          </li>
        </ul>
      </section>

      {/* 📥 Tools */}
      <section className="bg-gray-800 p-6 rounded-lg shadow-md max-w-4xl mx-auto mb-8">
        <h2 className="text-2xl text-gold font-semibold mb-4">
          📥 Legacy Planning Tools
        </h2>
        <ul className="list-disc text-gray-300 pl-6 space-y-3">
          <li>
            <a
              href="/downloads/estate-planning-starter-kit.pdf"
              className="text-gold underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Estate Planning Starter Kit
            </a>{" "}
            – Wills, living trusts, directives, and simple legal tips.
          </li>
          <li>
            <a
              href="/downloads/legacy-letter-template.pdf"
              className="text-gold underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Legacy Letter Template
            </a>{" "}
            – Write your family a letter they will never forget.
          </li>
          <li>
            <a
              href="/downloads/wealth-transfer-checklist.pdf"
              className="text-gold underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Wealth Transfer Checklist
            </a>{" "}
            – What to review and prepare step by step.
          </li>
          <li>
            <a
              href="/downloads/family-conversation-guide.pdf"
              className="text-gold underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Family Financial Conversation Guide
            </a>{" "}
            – Open the dialogue about money, legacy, and values.
          </li>
        </ul>
      </section>

      {/* 💡 Final Reflection */}
      <section className="bg-gray-800 p-6 rounded-lg shadow-md max-w-4xl mx-auto mb-10">
        <h2 className="text-2xl text-gold font-semibold mb-4">
          💡 Final Reflection
        </h2>
        <p className="text-gray-300">
          Legacy is about more than dollars—it’s about dignity, direction, and
          generational impact. Document what matters most, protect it, and share
          the wisdom that brought you here.
        </p>
      </section>

      {/* 🔁 Navigation */}
      <div className="flex justify-between max-w-4xl mx-auto mt-6">
        <Link
          href="/premium-finance/module-7"
          className="inline-block px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
        >
          ← Back to Module 7
        </Link>

        <Link
          href="/premium-finance/index"
          className="inline-block px-4 py-2 bg-gold text-black rounded hover:bg-yellow-500 transition"
        >
          View All Modules →
        </Link>
      </div>
    </div>
  );
};

export default Module8;
