import React from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Home } from "lucide-react";

const RealEstatePage = () => {
  const router = useRouter();

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-gold to-yellow-500 p-20 text-center">
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative z-10">
          <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight">
            Real Estate Investment for Building Generational Wealth
          </h1>
          <p className="text-xl md:text-2xl mt-4 text-gray-300">
            Real estate offers a wealth-building strategy with long-term
            benefits. Here&rsquo;s how you can invest and secure your future.
          </p>
        </div>
      </section>

      {/* Back Button */}
      <div className="mt-6 text-center">
        <Link href="/">
          <button className="px-6 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-yellow-500 transition">
            <Home className="w-6 h-6 mr-2" /> Back to Home
          </button>
        </Link>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6 space-y-8">
        {/* Section 1: Understanding Real Estate Investment */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 my-6">
          <h2 className="text-3xl font-bold text-gold mb-4">
            1. Understanding Real Estate Investment
          </h2>
          <p className="text-gray-300 mb-4">
            Real estate investment is about purchasing property (either
            residential or commercial) with the goal of generating income,
            appreciation, or both over time. The three primary types of real
            estate investments are:
          </p>
          <ul className="list-disc pl-6 text-gray-300">
            <li>
              <strong>Residential Real Estate:</strong> Includes single-family
              homes, multi-family units, and vacation rentals. Investors can
              collect rent and experience property value appreciation over time.
            </li>
            <li>
              <strong>Commercial Real Estate:</strong> Includes office
              buildings, retail spaces, warehouses, and other commercial
              properties. It&rsquo;s more complex but offers higher returns.
            </li>
            <li>
              <strong>Real Estate Investment Trusts (REITs):</strong> Allows you
              to invest in a portfolio of real estate properties without
              directly owning physical properties. It&rsquo;s a more passive
              investment method.
            </li>
          </ul>
        </div>

        {/* Section 2: Why Real Estate? */}
        <div className="bg-blue-600 rounded-lg shadow-lg p-6 my-6">
          <h2 className="text-3xl font-bold text-white mb-4">
            2. Why Real Estate?
          </h2>
          <p className="text-gray-300 mb-4">
            Investing in real estate is one of the most powerful ways to build
            long-term wealth. Here's why it's important:
          </p>
          <ul className="list-disc pl-6 text-gray-300">
            <li>
              <strong>Building Equity:</strong> Equity is the difference between
              the value of a property and what you owe. Over time, as you make
              payments and the property value increases, your equity grows.
            </li>
            <li>
              <strong>Appreciation and Value Growth:</strong> Real estate
              generally appreciates over time, especially in strong economic
              areas. Black families investing today could see significant value
              growth over the decades.
            </li>
            <li>
              <strong>Rental Income for Steady Cash Flow:</strong> Owning rental
              properties provides consistent monthly income. This can support
              your household, help pay down the property, or be reinvested into
              more opportunities.
            </li>
          </ul>
        </div>

        {/* Section 3: How to Get Started with Real Estate Investments */}
        <div className="bg-yellow-600 rounded-lg shadow-lg p-6 my-6">
          <h2 className="text-3xl font-bold text-black mb-4">
            3. How to Get Started with Real Estate Investments
          </h2>
          <p className="text-black mb-4">
            Here&rsquo;s a step-by-step guide to help Black families start
            investing in real estate:
          </p>
          <h3 className="text-2xl font-bold text-black mb-2">
            Step 1: Financial Preparation
          </h3>
          <ul className="list-disc pl-6 text-black">
            <li>
              <strong>Improve Credit Score:</strong> A higher score makes it
              easier to get better interest rates on loans. Pay down debt and
              maintain low credit usage.
            </li>
            <li>
              <strong>Save for a Down Payment:</strong> Most traditional
              mortgages require a 3-20% down payment. Start saving early to
              secure your investment.
            </li>
            <li>
              <strong>Understand Your Budget:</strong> Ensure you can handle
              mortgage payments, taxes, and insurance. Financial stability is
              key before making a large purchase.
            </li>
          </ul>

          <h3 className="text-2xl font-bold text-black mb-2">
            Step 2: Choose the Type of Real Estate Investment
          </h3>
          <ul className="list-disc pl-6 text-black">
            <li>
              <strong>Single-Family Rentals (SFRs):</strong> These are homes you
              purchase to rent out, usually requiring less capital and easier
              management.
            </li>
            <li>
              <strong>Multi-Family Units (MFUs):</strong> Duplexes, triplexes,
              or apartments that generate higher rental income. They require
              more management but yield better returns.
            </li>
            <li>
              <strong>Fix-and-Flip:</strong> Buy a property in need of
              renovation, fix it, and sell it for a profit. It&rsquo;s faster
              but requires understanding property values and renovation costs.
            </li>
          </ul>

          <h3 className="text-2xl font-bold text-black mb-2">
            Step 3: Financing the Investment
          </h3>
          <ul className="list-disc pl-6 text-black">
            <li>
              <strong>Traditional Mortgages:</strong> Common for home purchases,
              allowing you to make consistent payments with lower interest
              rates.
            </li>
            <li>
              <strong>Hard Money Loans:</strong> Short-term loans for properties
              needing renovation, often with higher interest rates.
            </li>
            <li>
              <strong>Private Lenders:</strong> Private investors who can lend
              you money with flexible terms but typically at a higher interest
              rate.
            </li>
          </ul>

          <h3 className="text-2xl font-bold text-black mb-2">
            Step 4: Finding the Right Property
          </h3>
          <ul className="list-disc pl-6 text-black">
            <li>
              <strong>Gentrifying Neighborhoods:</strong> Invest in areas with
              rising property values. These neighborhoods often see appreciation
              in value as they improve.
            </li>
            <li>
              <strong>Urban/Suburban Areas:</strong> Areas with strong rental
              markets, nearby amenities, and growing populations are ideal for
              investment.
            </li>
            <li>
              <strong>Foreclosures or Auctions:</strong> Find properties at
              lower prices through foreclosure sales or auctions, but be ready
              for repairs.
            </li>
          </ul>

          <h3 className="text-2xl font-bold text-black mb-2">
            Step 5: Start Small and Scale Up
          </h3>
          <ul className="list-disc pl-6 text-black">
            <li>
              <strong>Start with Single-Family Rentals:</strong> Use rental
              income to cover expenses and reinvest into more properties.
            </li>
            <li>
              <strong>Reinvest Rental Income:</strong> Once you start earning
              cash flow, use it to pay down the mortgage or invest in additional
              properties.
            </li>
            <li>
              <strong>Leverage Equity:</strong> Once equity builds in your
              properties, use it for down payments on more investments.
            </li>
          </ul>
        </div>

        {/* Section 4: Building Generational Wealth */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 my-6">
          <h2 className="text-3xl font-bold text-gold mb-4">
            4. Building Generational Wealth with Real Estate
          </h2>
          <p className="text-gray-300 mb-4">
            Real estate can be one of the most powerful ways to create
            **generational wealth**. Here&rsquo;s how real estate builds wealth
            over time:
          </p>
          <ul className="list-disc pl-6 text-gray-300">
            <li>
              <strong>Creating a Legacy:</strong> Owning property provides
              equity that can be passed down to heirs. It gives future
              generations a stable financial foundation.
            </li>
            <li>
              <strong>Cash Flow:</strong> Rental properties can generate
              consistent income for future generations, allowing them to live
              comfortably without relying on jobs.
            </li>
            <li>
              <strong>Real Estate as a Family Business:</strong> Families can
              create a legacy of property management, contracting, and
              renovations, passing down knowledge and wealth.
            </li>
          </ul>
        </div>

        {/* Section 5: Overcoming Challenges */}
        <div className="bg-yellow-600 rounded-lg shadow-lg p-6 my-6">
          <h2 className="text-3xl font-bold text-black mb-4">
            5. Overcoming Challenges and Making It Work
          </h2>
          <p className="text-black mb-4">
            While real estate investing can be extremely profitable, there are
            challenges to overcome:
          </p>
          <ul className="list-disc pl-6 text-black">
            <li>
              <strong>Lack of Capital:</strong> Partner with others, consider
              crowdfunding, or leverage existing property equity to overcome
              this challenge.
            </li>
            <li>
              <strong>Property Management:</strong> Hire property managers or
              learn basic maintenance skills to reduce operational costs and
              manage your properties effectively.
            </li>
          </ul>
        </div>

        {/* Conclusion */}
        <div className="text-center py-6 bg-gray-900 rounded-lg p-6">
          <h2 className="text-3xl font-bold mb-4 text-gold">
            Start Today for a Better Future
          </h2>
          <p className="text-lg max-w-2xl mx-auto text-white">
            Investing in real estate is a powerful way to build wealth and
            ensure that your family&rsquo;s financial future is secure. By
            taking action today—whether through purchasing a home, investing in
            rental properties, or participating in real estate crowdfunding—you
            can begin building a legacy of financial independence that will
            benefit multiple generations.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RealEstatePage;
