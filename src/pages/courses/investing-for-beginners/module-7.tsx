import React from "react";
import Link from "next/link";

export default function Module7() {
  return (
    <div className="min-h-screen bg-gray-900 text-white px-4 py-12">
      <div className="max-w-3xl mx-auto bg-gray-800 p-6 md:p-10 rounded-xl shadow-xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gold">
          Module 7: Investing in Gold, Silver & Alternative Assets
        </h1>
        <p className="mb-7 text-lg text-gray-200">
          Stocks and bonds are the foundation of most portfolios, but{" "}
          <span className="text-gold font-bold">alternative assets</span>—like
          gold, silver, real estate, crypto, and art—can help you diversify,
          protect your wealth, and discover new opportunities. This module
          explains what alternatives are and how to use them wisely.
        </p>

        {/* Why Consider Alternatives */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-2 text-blue-400">
            Why Consider Alternatives?
          </h2>
          <p>
            Alternative assets often don’t move in the same direction as stocks
            and bonds. They provide a “hedge” against inflation, market
            downturns, or uncertainty. Adding a small portion to your portfolio
            can reduce overall risk and sometimes boost returns.
          </p>
        </section>

        {/* Gold & Silver */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-2 text-blue-400">
            Gold & Silver
          </h2>
          <p>
            Gold and silver have been trusted for thousands of years as stores
            of value. They’re considered “safe haven” assets, especially in
            uncertain times or during inflation. Black-owned firms like{" "}
            <a
              href="https://www.goldfromthesoil.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-yellow-400"
            >
              Gold From The Soil
            </a>{" "}
            make gold investing accessible and educational for the Black
            community.
          </p>
          <ul className="list-disc ml-6 my-2 text-gray-100">
            <li>
              Ways to invest: Buy physical coins/bars, gold/silver ETFs, or
              mining company stocks.
            </li>
            <li>
              <span className="text-gold font-bold">Pros:</span> Protection from
              inflation and crashes; universal value.
            </li>
            <li>
              <span className="text-gold font-bold">Cons:</span> No income or
              dividends; prices can be volatile and may not always grow quickly.
            </li>
          </ul>
        </section>

        {/* Other Alternative Assets */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-2 text-blue-400">
            Other Alternative Assets
          </h2>
          <ul className="list-disc ml-6 my-2 text-gray-100">
            <li>
              <span className="text-gold font-bold">
                Real Estate Crowdfunding:
              </span>
              Invest small amounts in property projects alongside others. Try{" "}
              <a
                href="https://www.buytheblock.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-yellow-400"
              >
                Buy The Block
              </a>{" "}
              (Black-owned) or Fundrise.
            </li>
            <li>
              <span className="text-gold font-bold">Cryptocurrency:</span>
              Digital assets like Bitcoin or Ethereum. Can have high returns but
              are very risky and volatile—never invest more than you can afford
              to lose.
            </li>
            <li>
              <span className="text-gold font-bold">Art & Collectibles:</span>
              Paintings, sneakers, wine, watches, and more. They can grow in
              value, but require expertise and can be hard to sell fast.
            </li>
            <li>
              <span className="text-gold font-bold">Private Businesses:</span>
              Invest directly in startups or small businesses—sometimes via
              local networks or crowdfunding sites such as{" "}
              <a
                href="https://www.seedatthetable.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-yellow-400"
              >
                Seed At The Table
              </a>{" "}
              or{" "}
              <a
                href="https://www.fundblackfounders.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-yellow-400"
              >
                Fund Black Founders
              </a>
              .
            </li>
          </ul>
        </section>

        {/* Risks and Rewards */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-2 text-blue-400">
            Risks and Rewards
          </h2>
          <p>
            Alternatives can help smooth out the ups and downs of your
            investments—but they require research and carry unique risks.
            They’re often harder to sell quickly (“illiquid”), can have high
            fees, and might be less regulated. For most people, alternatives
            should be a small part (5–15%) of the overall portfolio.
          </p>
        </section>

        {/* Action Steps */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-2 text-gold">Action Steps</h2>
          <ul className="list-disc ml-6 text-gray-200">
            <li>
              Research one alternative asset—gold, crypto, real estate, art, or
              private business. Write down its pros, cons, and whether it fits
              your goals.
            </li>
            <li>
              Consider adding a small investment in alternatives, but always
              keep the majority of your portfolio in stocks, bonds, or funds.
            </li>
            <li>
              <span className="text-yellow-400 font-bold">Pro Tip:</span> If
              you’re interested in Black-owned alternatives, check platforms
              above or your local network for opportunities.
            </li>
          </ul>
        </section>

        {/* Key Takeaways */}
        <section className="mb-14">
          <h2 className="text-xl font-bold mb-2 text-blue-400">
            Key Takeaways
          </h2>
          <ul className="list-disc ml-6 text-gray-100">
            <li>
              Alternative assets help you diversify and protect your
              portfolio—but require caution and learning.
            </li>
            <li>
              Gold, silver, real estate, crypto, and collectibles are all
              options. Know the unique risks of each.
            </li>
            <li>
              Do your research, start small, and make sure your core investments
              are strong before expanding into alternatives.
            </li>
          </ul>
        </section>

        {/* Navigation */}
        <div className="flex justify-between mt-10">
          <Link href="/courses/investing-for-beginners/module-6">
            <span className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-800 text-white cursor-pointer shadow">
              ← Previous
            </span>
          </Link>
          <Link href="/courses/investing-for-beginners/module-8">
            <span className="px-4 py-2 rounded bg-gold hover:bg-yellow-400 text-black font-bold shadow transition">
              Next: Avoiding Common Mistakes →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
