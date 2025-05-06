// pages/premium-finance/index.tsx
"use client";

import React from "react";
import Link from "next/link";

const courseModules = [
  {
    number: 1,
    title: "Breaking Financial Myths",
    path: "/premium-finance/module-1",
  },
  {
    number: 2,
    title: "Budgeting for Real Life",
    path: "/premium-finance/module-2",
  },
  {
    number: 3,
    title: "Credit Repair & Power",
    path: "/premium-finance/module-3",
  },
  {
    number: 4,
    title: "Building Wealth with Investments",
    path: "/premium-finance/module-4",
  },
  {
    number: 5,
    title: "Side Hustles & Business Basics",
    path: "/premium-finance/module-5",
  },
  {
    number: 6,
    title: "Debt Management & Elimination",
    path: "/premium-finance/module-6",
  },
  {
    number: 7,
    title: "Retirement Planning",
    path: "/premium-finance/module-7",
  },
  {
    number: 8,
    title: "Building Legacy & Asset Protection",
    path: "/premium-finance/module-8",
  },
];

const PremiumFinanceHome = () => (
  <div className="min-h-screen bg-black text-white p-6 md:p-12">
    <h1 className="text-4xl md:text-5xl font-bold text-gold text-center mb-10">
      Premium Financial Literacy Course
    </h1>

    <p className="text-gray-300 text-center max-w-2xl mx-auto mb-12">
      Welcome to your premium financial journey. Work through the modules in
      order or pick what matters most to you first. Each module includes
      lessons, tools, and action steps.
    </p>

    {/* Modules grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
      {courseModules.map((mod) => (
        <Link
          href={mod.path}
          key={mod.number}
          className="bg-gray-800 p-6 rounded-lg shadow-lg hover:bg-gray-700 transition block"
        >
          <h2 className="text-xl font-bold text-gold mb-2">
            Module {mod.number}: {mod.title}
          </h2>
          <p className="text-gray-400 text-sm">Click to begin this module</p>
        </Link>
      ))}
    </div>

    {/* Back to Home */}
    <div className="text-center mt-12">
      <Link
        href="/"
        className="inline-block px-6 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-yellow-500 transition"
      >
        Back to Home
      </Link>
    </div>
  </div>
);

export default PremiumFinanceHome;
