import React from "react";
import Link from "next/link";
import Image from "next/legacy/image";
import BuyNowButton from "@/components/BuyNowButton";

const FinancialLiteracy = () => {
  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* 🔥 Background Effects */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40 z-0"
        style={{ backgroundImage: "url('/black-wealth-bg.jpg')" }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-50 z-0"></div>

      {/* 🔥 Hero Section */}
      <header className="text-center py-32 relative z-10">
        <Image
          src="/favicon.png"
          alt="BWE Logo"
          width={120}
          height={120}
          className="mx-auto mb-4 animate-fadeIn"
        />
        <h1 className="text-6xl md:text-4xl font-extrabold tracking-wide text-gold neon-text animate-slideUp">
          Premium Financial Literacy Course
        </h1>
        <p className="text-xl md:text-2xl mt-4 font-light text-gray-300 animate-fadeIn">
          Lifetime access to the tools, knowledge, and confidence to build real
          Black wealth.
        </p>
      </header>

      {/* 🔥 Premium Offer Section */}
      <div className="container mx-auto p-6 space-y-12 relative z-10">
        <section className="bg-gray-900 p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-3xl font-semibold text-gold mb-4">
            Unlock the Full Premium Course – Just $49
          </h2>
          <p className="text-gray-300 text-lg mb-6 max-w-2xl mx-auto">
            Learn how to budget, fix credit, invest, and grow legacy wealth with
            step-by-step guidance. This is more than education — its
            transformation. Pay once. Own it forever.
          </p>

          <div className="grid md:grid-cols-2 gap-8 text-left text-gray-300 max-w-4xl mx-auto">
            <div>
              <h3 className="text-xl text-gold font-semibold mb-2">
                ✅ What You will Learn:
              </h3>
              <ul className="list-disc pl-6">
                <li>Budgeting and goal-setting on any income</li>
                <li>How to build and repair your credit</li>
                <li>Real estate, stocks, and investment basics</li>
                <li>Debt elimination strategies that actually work</li>
                <li>How to protect assets and build generational wealth</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl text-gold font-semibold mb-2">
                ✅ What is Included:
              </h3>
              <ul className="list-disc pl-6">
                <li>8 full modules + bonus content</li>
                <li>Downloadable worksheets, templates, and credit letters</li>
                <li>Lifetime access with free updates</li>
                <li>Optional certificate of completion</li>
              </ul>
            </div>
          </div>

          <div className="mt-8">
            <BuyNowButton
              userId="replace-with-user-id"
              itemId="financial-literacy-premium"
              amount={49.0}
              type="course"
            />
            <p className="text-sm text-gray-400 mt-2">
              One-time payment. Lifetime access.
            </p>
          </div>
        </section>

        {/* 🧠 Module Previews */}
        <section className="space-y-10">
          <h2 className="text-3xl font-bold text-gold text-center">
            Course Modules
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: "1. Breaking Financial Myths",
                text: "Unlearn the lies we have been taught about money and power. Start with a mindset built for legacy.",
              },
              {
                title: "2. Budgeting for Real Life",
                text: "Set goals, manage spending, and build your emergency fund with clear tools that work.",
              },
              {
                title: "3. Credit Repair & Power",
                text: "Raise your score fast with templates, credit letters, and a system that works for us.",
              },
              {
                title: "4. Building Wealth with Investments",
                text: "Learn how stocks, real estate, and passive income can work for your family — even starting small.",
              },
              {
                title: "5. Side Hustles & Business Basics",
                text: "Turn skills into income, register your business, and grow it step by step.",
              },
              {
                title: "6. Debt Management & Elimination",
                text: "Say goodbye to debt using proven plans like the snowball and avalanche methods.",
              },
              {
                title: "7. Retirement Planning",
                text: "Start a retirement account now — even if you are late — and invest the smart way.",
              },
              {
                title: "8. Building Legacy & Asset Protection",
                text: "Estate planning, wills, and how to legally pass down your wealth and protect it.",
              },
            ].map((mod, i) => (
              <div key={i} className="bg-gray-800 p-6 rounded-lg shadow-md">
                <h4 className="text-xl font-semibold text-gold mb-2">
                  {mod.title}
                </h4>
                <p className="text-gray-300">{mod.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 👇 Back to Home */}
        <section className="text-center mt-12">
          <Link href="/">
            <button className="px-6 py-3 bg-gold text-black font-semibold text-lg rounded-lg hover:bg-yellow-500 transition">
              Back to Home
            </button>
          </Link>
        </section>
      </div>
    </div>
  );
};

export default FinancialLiteracy;
