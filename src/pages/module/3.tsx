import React from "react";
import { useRouter } from "next/router";
import Link from "next/link";

const Module3: React.FC = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
        {/* Back Button */}
        <div className="mb-4">
          <button
            onClick={() => router.push("/course-dashboard")}
            className="px-4 py-2 bg-gray-600 text-white font-bold rounded hover:bg-gray-700 transition"
          >
            Back to Course Dashboard
          </button>
        </div>

        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gold">
            Module 3: Creating a Budget
          </h1>
          <p className="text-gray-300 mt-2">
            Learn how to create a budget that aligns with your financial goals
            and manage your expenses effectively.
          </p>
        </header>

        {/* Overview Section */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">Overview</h2>
          <p className="text-gray-300">
            This module covers the importance of creating a monthly budget,
            provides a step-by-step guide, and introduces popular budgeting
            methods to help you manage your income and expenses effectively.
          </p>
        </section>

        {/* Step-by-Step Guide Section */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">
            Step-by-Step Guide to Creating a Monthly Budget
          </h2>
          <ul className="list-decimal ml-6 mt-4 text-gray-300">
            <li>
              <strong>Track Your Income:</strong> Identify all sources of
              income, including salary, side jobs, etc.
            </li>
            <li>
              <strong>Identify Your Fixed Expenses:</strong> These are regular
              expenses that don&rsquo;t change, such as rent, utilities, and
              insurance.
            </li>
            <li>
              <strong>Identify Your Variable Expenses:</strong> These fluctuate
              from month to month, such as groceries, entertainment, and gas.
            </li>
            <li>
              <strong>Set Spending Limits:</strong> Allocate specific amounts to
              each category based on your income and financial goals.
            </li>
            <li>
              <strong>Review and Adjust:</strong> At the end of each month,
              review your spending and adjust your budget as necessary.
            </li>
          </ul>
        </section>

        {/* Budgeting Methods Section */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">
            Budgeting Methods
          </h2>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            <li>
              <strong>50/30/20 Rule:</strong> Allocate 50% of your income to
              needs (rent, utilities), 30% to wants (dining out, entertainment),
              and 20% to savings and debt repayment.
            </li>
            <li>
              <strong>Zero-Based Budgeting:</strong> Every dollar is assigned a
              purpose. Income minus expenses equals zero. This forces you to
              account for every dollar you earn.
            </li>
            <li>
              <strong>Envelope System:</strong> Cash is physically divided into
              envelopes for different categories (e.g., groceries,
              entertainment). When the envelope is empty, stop spending in that
              category.
            </li>
          </ul>
        </section>

        {/* Tools and Apps Section */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">
            Tools and Apps to Help Track Your Expenses
          </h2>
          <ul className="list-decimal ml-6 mt-4 text-gray-300">
            <li>
              <strong>Mint:</strong> Track spending, create budgets, and set
              financial goals.
            </li>
            <li>
              <strong>YNAB (You Need A Budget):</strong> Focuses on zero-based
              budgeting and helping prioritize savings.
            </li>
            <li>
              <strong>EveryDollar:</strong> A simple tool to plan monthly
              expenses and track progress.
            </li>
          </ul>
        </section>

        {/* Key Takeaways Section */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">Key Takeaways</h2>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            <li>
              Budgeting helps ensure that you&rsquo;re living within your means
              and aligning your spending with your financial goals.
            </li>
            <li>
              There are various methods to budget, so choose the one that works
              best for you.
            </li>
            <li>
              Use budgeting tools and apps to make the process easier and more
              efficient.
            </li>
          </ul>
        </section>

        {/* Next Steps Section */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">Next Steps</h2>
          <p className="text-gray-300">
            Continue to the next module, where we will discuss how to save for
            the future and build an emergency fund.
          </p>
          <Link href="/module/4">
            <button className="mt-4 py-2 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition">
              Continue to Module 4
            </button>
          </Link>
        </section>

        {/* Downloadable Resource Section */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">
            Downloadable Resource
          </h2>
          <p className="text-gray-300">
            Download the <strong>Monthly Budget Template</strong> to help you
            track your income and expenses.
          </p>
          <a
            href="https://open.umn.edu/opentextbooks/textbooks/31"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Download Monthly Budget Template
          </a>
        </section>

        {/* Quiz Section */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">Quiz</h2>
          <p className="text-gray-300">
            Test your understanding of budgeting methods:
          </p>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            <li>
              Question 1: What is the main principle of the 50/30/20 Rule?
            </li>
            <li>
              A) Allocate 50&percnt; to savings, 30&percnt; to needs, 20&percnt;
              to wants
            </li>
            <li>
              B) Allocate 50&percnt; to needs, 30&percnt; to wants, 20&percnt;
              to savings and debt repayment
            </li>
            <li>
              C) Allocate 50&percnt; to debt, 30&percnt; to savings, 20&percnt;
              to rent
            </li>
            <p className="text-green-500">Answer: B</p>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default Module3;
