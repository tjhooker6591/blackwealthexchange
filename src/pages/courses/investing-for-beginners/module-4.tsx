import React from "react";
import Link from "next/link";

export default function Module4() {
  return (
    <div className="min-h-screen bg-gray-900 text-white px-4 py-12">
      <div className="max-w-3xl mx-auto bg-gray-800 p-6 md:p-10 rounded-xl shadow-xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gold">
          Module 4: Risk, Return & Building a Diversified Portfolio
        </h1>
        <p className="mb-7 text-lg text-gray-200">
          Every investment comes with risk, but smart investors know how to manage it. This module breaks down what risk means, how it connects to your potential returns, and how to protect yourself by building a diversified portfolio—one of the most powerful tools for long-term success.
        </p>

        {/* What is Risk? */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-2 text-blue-400">What is Risk?</h2>
          <p>
            <span className="text-gold font-bold">Risk</span> is the possibility that your investment will lose value. All investments have some risk—stocks can drop, companies can go out of business, real estate markets can slow, and even “safe” investments like bonds can lose value to inflation.
          </p>
          <ul className="list-disc ml-6 my-2 text-gray-100">
            <li>
              <span className="text-gold">Market Risk:</span> The value of investments goes up and down with the economy.
            </li>
            <li>
              <span className="text-gold">Inflation Risk:</span> Your money loses buying power over time if it grows slower than prices rise.
            </li>
            <li>
              <span className="text-gold">Company/Asset Risk:</span> A single business or property can lose value or fail.
            </li>
          </ul>
        </section>

        {/* What is Return? */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-2 text-blue-400">What is Return?</h2>
          <p>
            <span className="text-gold font-bold">Return</span> is the money you make (or lose) from an investment. It can come from price increases (appreciation), dividends, or interest payments.
          </p>
          <ul className="list-disc ml-6 my-2 text-gray-100">
            <li>
              <span className="text-gold">Higher risk, higher potential return.</span>
            </li>
            <li>
              <span className="text-gold">Lower risk, lower return.</span>
            </li>
          </ul>
          <p className="mt-2">
            Example: U.S. stocks have averaged about <span className="text-gold font-bold">7–10% per year</span> (long-term), while savings accounts are closer to <span className="text-gold">1–2% per year</span>.
          </p>
        </section>

        {/* Understanding Diversification */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-2 text-blue-400">Why Diversification Matters</h2>
          <p>
            <span className="text-gold font-bold">Diversification</span> means spreading your money across different investments—like stocks, bonds, and real estate—so you don’t have “all your eggs in one basket.” When one part of your portfolio falls, another may rise, protecting your wealth.
          </p>
          <div className="bg-black bg-opacity-60 rounded-lg shadow-lg p-4 my-4">
            <strong>Example:</strong>
            <ul className="list-disc ml-6 text-gray-100">
              <li>If you only own airline stocks, a travel downturn can hit you hard.</li>
              <li>If you own airline stocks, technology stocks, bonds, and real estate, a loss in one area might be balanced by gains in another.</li>
            </ul>
          </div>
          <p>
            Diversification is the <span className="text-gold font-bold">#1 way</span> to reduce risk and grow steady wealth.
          </p>
        </section>

        {/* Building Your Portfolio */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-2 text-gold">Building Your Portfolio</h2>
          <ul className="list-disc ml-6 text-gray-200">
            <li>
              Mix stocks, bonds, and other assets based on your goals and risk comfort.
            </li>
            <li>
              Younger investors often choose more stocks (higher growth, more risk), while those closer to retirement add more bonds (stability).
            </li>
            <li>
              Consider Black-owned businesses, funds, and community investments to align your dollars with your values.
            </li>
          </ul>
        </section>

        {/* Action Steps */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-2 text-blue-400">Action Steps</h2>
          <ul className="list-disc ml-6 text-gray-200">
            <li>
              Make a list of the investments you own (if any). Are they diversified?
            </li>
            <li>
              Decide on your ideal “mix” for your goals—write it down, even if you’re just starting!
            </li>
            <li>
              Research a mutual fund or ETF that offers diversification (for example, an S&P 500 index fund).
            </li>
          </ul>
        </section>

        {/* Key Takeaways */}
        <section className="mb-14">
          <h2 className="text-xl font-bold mb-2 text-gold">Key Takeaways</h2>
          <ul className="list-disc ml-6 text-gray-100">
            <li>
              Risk and return go hand-in-hand—higher returns require taking more risk.
            </li>
            <li>
              Diversification protects your portfolio and reduces the impact of any one investment losing value.
            </li>
            <li>
              Build a mix that fits your goals, timeline, and comfort with risk.
            </li>
          </ul>
        </section>

        {/* Navigation */}
        <div className="flex justify-between mt-10">
          <Link href="/courses/investing-for-beginners/module-3">
            <span className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-800 text-white cursor-pointer shadow">
              ← Previous
            </span>
          </Link>
          <Link href="/courses/investing-for-beginners/module-5">
            <span className="px-4 py-2 rounded bg-gold hover:bg-yellow-400 text-black font-bold shadow transition">
              Next: How to Get Started Step-by-Step →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
