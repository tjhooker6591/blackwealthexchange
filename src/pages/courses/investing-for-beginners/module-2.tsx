import React from "react";
import Link from "next/link";

export default function Module2() {
  return (
    <div className="min-h-screen bg-gray-900 text-white px-4 py-12">
      <div className="max-w-3xl mx-auto bg-gray-800 p-6 md:p-10 rounded-xl shadow-xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gold">
          Module 2: Types of Investments
        </h1>
        <p className="mb-7 text-lg text-gray-200">
          Now that you know why investing is essential, let’s break down the
          **major types of investments** you can use to build wealth.
          Understanding your options is the foundation of a successful,
          diversified portfolio—no matter your starting point.
        </p>

        {/* Stocks */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-2 text-blue-400">1. Stocks</h2>
          <p>
            <span className="text-gold font-bold">Stocks</span> represent
            ownership in a company. Buying a stock (or “share”) makes you a
            part-owner, entitled to a slice of its growth and profits.
            Historically, stocks offer the highest returns—but with higher risk.
          </p>
          <ul className="list-disc ml-6 my-2 text-gray-200">
            <li>Best for: Long-term growth, building wealth over decades</li>
            <li>Risks: Prices can swing wildly in the short term</li>
            <li>
              Black-owned example:{" "}
              <a
                href="https://www.urban1.com/"
                className="text-gold hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Urban One, Inc.
              </a>
            </li>
            <li>How to start: Open an investing app or online brokerage</li>
          </ul>
        </section>

        {/* Bonds */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-2 text-blue-400">2. Bonds</h2>
          <p>
            <span className="text-gold font-bold">Bonds</span> are loans you
            make to companies or governments. You get steady interest and your
            principal back after a set period. Bonds are usually less risky than
            stocks and offer more predictable income.
          </p>
          <ul className="list-disc ml-6 my-2 text-gray-200">
            <li>
              Best for: Stability, reliable income, reducing risk in your
              portfolio
            </li>
            <li>Risks: Lower returns, inflation can erode value</li>
            <li>
              How to start: Buy individual bonds, or invest through bond funds
              and ETFs in your brokerage account
            </li>
          </ul>
        </section>

        {/* Mutual Funds & ETFs */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-2 text-blue-400">
            3. Mutual Funds & ETFs
          </h2>
          <p>
            <span className="text-gold font-bold">Mutual Funds</span> and{" "}
            <span className="text-gold font-bold">
              ETFs (Exchange-Traded Funds)
            </span>{" "}
            allow you to pool money with other investors to buy a basket of
            stocks, bonds, or other assets. This makes it easy to diversify,
            even with small amounts of money. ETFs trade like stocks; mutual
            funds are bought from fund companies.
          </p>
          <ul className="list-disc ml-6 my-2 text-gray-200">
            <li>Best for: Beginners, easy instant diversification</li>
            <li>
              Risks: Fund performance depends on its investments; pay attention
              to fees
            </li>
            <li>
              How to start: Look for funds tracking the S&P 500 or
              community-oriented ETFs (some highlight Black-led companies!)
            </li>
          </ul>
        </section>

        {/* Real Estate */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-2 text-blue-400">
            4. Real Estate
          </h2>
          <p>
            <span className="text-gold font-bold">Real estate</span> means
            owning property (homes, apartments, commercial spaces) or investing
            in REITs (Real Estate Investment Trusts) for a hands-off approach.
            Real estate can provide income, appreciation, and community
            impact—think about supporting Black real estate investors and local
            revitalization.
          </p>
          <ul className="list-disc ml-6 my-2 text-gray-200">
            <li>Best for: Long-term growth, passive income, legacy</li>
            <li>
              Risks: High up-front cost, less liquid, property management
              headaches
            </li>
            <li>
              How to start: Buy REITs in your brokerage account, or research
              local Black real estate groups
            </li>
          </ul>
        </section>

        {/* Alternatives */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-2 text-blue-400">
            5. Alternatives
          </h2>
          <p>
            <span className="text-gold font-bold">Alternatives</span> include
            everything outside the basics: gold, cryptocurrency, private
            businesses, startups, art, and collectibles. These can offer high
            returns but require more research and risk-tolerance.
          </p>
          <ul className="list-disc ml-6 my-2 text-gray-200">
            <li>
              Best for: Experienced investors, those seeking extra
              diversification
            </li>
            <li>Risks: High risk, less liquidity, less regulation</li>
            <li>
              How to start: Invest small, only what you can afford to lose. For
              gold, consider Black-owned firms like{" "}
              <a
                href="https://www.goldfromthesoil.com/"
                className="text-gold hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Gold From The Soil
              </a>
              .
            </li>
          </ul>
        </section>

        {/* How to Choose Your Mix */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-2 text-gold">
            How to Choose Your Mix
          </h2>
          <p>
            Your investment mix should match your{" "}
            <span className="text-blue-300 font-semibold">
              goals, timeline, and comfort with risk
            </span>
            . Most beginners start with a simple combo of stocks and funds,
            adding bonds and real estate as they grow. Diversifying is key!
          </p>
          <p className="mt-2">
            <span className="font-bold text-blue-400">Pro Tip:</span> You don’t
            need a lot of money to get started. Consistency and learning are
            more important than a big account balance.
          </p>
        </section>

        {/* Action Steps */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-2 text-blue-400">Action Steps</h2>
          <ul className="list-disc ml-6 text-gray-200">
            <li>
              Pick one type of investment to learn more about. Research a
              company, fund, or property in that category.
            </li>
            <li>
              Write down what excites or worries you about it, and any questions
              for future modules.
            </li>
            <li>
              <span className="text-gold font-semibold">Community Idea:</span>{" "}
              Look for Black-owned funds, companies, or REITs to support
              collective growth.
            </li>
          </ul>
        </section>

        {/* Key Takeaways */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-2 text-gold">Key Takeaways</h2>
          <ul className="list-disc ml-6 text-gray-100">
            <li>
              There are many investment types—stocks, bonds, funds, real estate,
              and more.
            </li>
            <li>Each comes with unique risks and rewards.</li>
            <li>
              Diversification across types helps protect and grow your wealth.
            </li>
          </ul>
        </section>

        {/* Navigation */}
        <div className="flex justify-between mt-10">
          <Link href="/courses/investing-for-beginners/module-1">
            <span className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-800 text-white cursor-pointer shadow">
              ← Previous
            </span>
          </Link>
          <Link href="/courses/investing-for-beginners/module-3">
            <span className="px-4 py-2 rounded bg-gold hover:bg-yellow-400 text-black font-bold shadow transition">
              Next: The Power of Compound Growth →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
