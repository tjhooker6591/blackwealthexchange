// /pages/financial-literacy.tsx

import React from "react";
import Link from "next/link";
import Image from "next/image";

const FinancialLiteracy = () => {
  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* 🔥 Background Effects */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: "url('/black-wealth-bg.jpg')" }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-50"></div>

      {/* 🔹 Navbar with Logo */}
      <nav className="absolute top-4 left-6 flex items-center space-x-3 z-20">
        <Image src="/bwe-logo.png" alt="BWE Logo" width={50} height={50} />
        <h1 className="text-xl font-bold text-gold">Black Wealth Exchange</h1>
      </nav>

      {/* 🔥 Hero Section */}
      <header className="text-center py-32 relative z-10">
        <Image
          src="/bwe-logo.png"
          alt="BWE Logo"
          width={120}
          height={120}
          className="mx-auto mb-4 animate-fadeIn"
        />
        <h1 className="text-6xl md:text-7xl font-extrabold tracking-wide text-gold neon-text animate-slideUp">
          Financial Literacy for African Americans
        </h1>
        <p className="text-xl md:text-2xl mt-4 font-light text-gray-300 animate-fadeIn">
          Empower yourself with financial knowledge to build generational
          wealth.
        </p>
      </header>

      {/* 🔥 Main Content */}
      <div className="container mx-auto p-6 space-y-8">
        <h2 className="text-3xl font-semibold text-gold mb-6">
          Mastering Financial Literacy
        </h2>

        {/* Building Wealth Through Investments */}
        <section className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-2xl font-semibold text-gold mb-4">
            Building Wealth Through Investments
          </h3>
          <p className="text-gray-300 mb-4">
            Building wealth through investments is one of the most effective
            ways to create long-term financial stability. Investments allow your
            money to grow over time, providing opportunities for compounding
            returns and financial growth.
          </p>
          <p className="text-gray-300 mb-4">
            There are several investment options available, including:
          </p>
          <ul className="list-disc pl-6 text-gray-300 mb-4">
            <li>
              <strong>Stocks:</strong> Investing in publicly traded companies
              allows you to own a portion of the company.
            </li>
            <li>
              <strong>Bonds:</strong> Debt securities issued by corporations or
              governments that pay interest and return principal at maturity.
            </li>
            <li>
              <strong>Real Estate:</strong> Rental income and property value
              appreciation.
            </li>
            <li>
              <strong>Mutual Funds & ETFs:</strong> Diversified investments
              pooling money from many investors.
            </li>
            <li>
              <strong>Cryptocurrency:</strong> Digital assets like Bitcoin and
              Ethereum — high risk, high reward.
            </li>
          </ul>
        </section>

        {/* Budgeting and Financial Planning */}
        <section className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-2xl font-semibold text-gold mb-4">
            Budgeting and Financial Planning
          </h3>
          <p className="text-gray-300 mb-4">
            Budgeting helps you track income and expenses, manage debt, and save
            for future goals.
          </p>
          <ul className="list-disc pl-6 text-gray-300 mb-4">
            <li>
              <strong>Set Goals:</strong> Like emergency savings, debt payoff,
              or buying a home.
            </li>
            <li>
              <strong>Track Spending:</strong> Know where your money is going.
            </li>
            <li>
              <strong>Emergency Fund:</strong> Save 3-6 months of living
              expenses.
            </li>
            <li>
              <strong>Debt Management:</strong> Prioritize high-interest debt.
            </li>
          </ul>
        </section>

        {/* Understanding Credit */}
        <section className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-2xl font-semibold text-gold mb-4">
            Understanding Credit
          </h3>
          <p className="text-gray-300 mb-4">
            Your credit score affects loan approvals, interest rates, and more.
          </p>
          <ul className="list-disc pl-6 text-gray-300 mb-4">
            <li>
              <strong>Pay on Time:</strong> Payment history is critical.
            </li>
            <li>
              <strong>Keep Balances Low:</strong> Use less than 30% of your
              limit.
            </li>
            <li>
              <strong>Do not Close Old Accounts:</strong> They help your credit
              history length.
            </li>
            <li>
              <strong>Check Reports:</strong> Dispute errors on your credit
              report.
            </li>
          </ul>
        </section>

        {/* Retirement Planning */}
        <section className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-2xl font-semibold text-gold mb-4">
            Retirement Planning
          </h3>
          <p className="text-gray-300 mb-4">
            The earlier you start saving for retirement, the more your money can
            grow.
          </p>
          <ul className="list-disc pl-6 text-gray-300 mb-4">
            <li>
              <strong>Start a 401(k), IRA, or Roth IRA:</strong> Take advantage
              of tax benefits.
            </li>
            <li>
              <strong>Contribute Regularly:</strong> Aim for 10-15% of your
              income.
            </li>
            <li>
              <strong>Get Employer Match:</strong> It is free money.
            </li>
            <li>
              <strong>Invest for Growth:</strong> Use long-term vehicles like
              index funds.
            </li>
          </ul>
        </section>

        {/* Debt Management */}
        <section className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-2xl font-semibold text-gold mb-4">
            Debt Management
          </h3>
          <p className="text-gray-300 mb-4">
            Debt can hold you back — but with a plan, you can overcome it.
          </p>
          <ul className="list-disc pl-6 text-gray-300 mb-4">
            <li>
              <strong>High-Interest First:</strong> Prioritize credit cards and
              payday loans.
            </li>
            <li>
              <strong>Snowball Method:</strong> Pay off small debts first to
              build momentum.
            </li>
            <li>
              <strong>Refinance:</strong> Lower your interest rates where
              possible.
            </li>
            <li>
              <strong>Seek Help:</strong> Consider a credit counselor if you are
              overwhelmed.
            </li>
          </ul>
        </section>

        {/* Back to Home */}
        <section className="text-center mt-10">
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
