// pages/premium-finance/module-2.tsx

import React from "react";
import Link from "next/link";

const Module2 = () => {
  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <h1 className="text-4xl md:text-5xl font-bold text-gold mb-4 text-center">
        Module 2: Budgeting for Real Life
      </h1>

      <p className="text-gray-300 text-lg max-w-3xl mx-auto text-center mb-4">
        Budgeting is not about restriction — it’s about freedom. This module will help you create a budget that works with your life, not against it.
      </p>

      <p className="text-gray-400 text-sm text-center mb-8">
        <strong>Featured Video:</strong> Tiffany Aliche – The Budgetnista: Four Steps To Take Control Of Your Money<br />
        <strong>Why:</strong> One of the most trusted Black voices in financial empowerment. Clear, real, and effective.
      </p>

      {/* 🎥 Video */}
      <div className="aspect-w-16 aspect-h-9 mb-8 max-w-4xl mx-auto">
        <iframe
          className="w-full h-full rounded-lg"
          src="https://www.youtube.com/embed/KAK8xtfljSE"
          title="Four Steps To Take Control Of Your Money"
          allowFullScreen
        ></iframe>
      </div>

      {/* 💡 Key Takeaways */}
      <section className="bg-gray-800 p-6 rounded-lg shadow-md max-w-4xl mx-auto mb-8">
        <h2 className="text-2xl text-gold font-semibold mb-4">Key Takeaways:</h2>
        <ul className="list-disc text-gray-300 pl-6 space-y-2">
          <li>Use values-based budgeting to match your plan with your priorities.</li>
          <li>Build a buffer for unexpected expenses instead of living check to check.</li>
          <li>Shift from reactive to proactive money planning.</li>
          <li>Learn and test 50/30/20, zero-based, and cash envelope methods.</li>
        </ul>
      </section>

      {/* 📥 Downloadable Toolkit */}
      <section className="bg-gray-800 p-6 rounded-lg shadow-md max-w-4xl mx-auto mb-8">
        <h2 className="text-2xl text-gold font-semibold mb-4">📥 Budgeting Tools & Worksheets:</h2>
        <ul className="list-disc text-gray-300 pl-6 space-y-3">
          <li>
            <a href="/downloads/monthly-budget-template.pdf" className="text-gold underline" target="_blank">
              Monthly Budget Template
            </a> – Plan income and expenses with a flexible layout.
          </li>
          <li>
            <a href="/downloads/emergency-fund-tracker.pdf" className="text-gold underline" target="_blank">
              Emergency Fund Tracker
            </a> – Set and visualize your first $1,000.
          </li>
          <li>
            <a href="/downloads/503020-budgeting-worksheet.pdf" className="text-gold underline" target="_blank">
              50/30/20 Rule Worksheet
            </a> – Break down spending into Needs, Wants, and Savings.
          </li>
        </ul>
      </section>

      {/* 💪 Mini Challenge */}
      <section className="bg-gray-800 p-6 rounded-lg shadow-md max-w-4xl mx-auto mb-8">
        <h2 className="text-2xl text-gold font-semibold mb-4">🔥 7-Day Money Awareness Challenge:</h2>
        <ul className="list-disc text-gray-300 pl-6 space-y-2">
          <li>Track every dollar spent for 7 days — no judgment.</li>
          <li>Highlight any “surprise” spending that added up.</li>
          <li>At the end, ask: What changes could I make to feel more in control?</li>
        </ul>
      </section>

      {/* 🧠 Reflection Prompt */}
      <section className="bg-gray-800 p-6 rounded-lg shadow-md max-w-4xl mx-auto mb-10">
        <h2 className="text-2xl text-gold font-semibold mb-4">🧠 Reflect & Apply:</h2>
        <p className="text-gray-300 mb-2">
          What are your top 3 financial stressors? What would peace look like in your money life?
        </p>
        <p className="text-gray-300 mt-2">
          Take 10 minutes and journal your answers in the worksheet or your phone notes.
        </p>
      </section>

      {/* 🔁 Navigation */}
      <div className="flex justify-between max-w-4xl mx-auto mt-10">
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
