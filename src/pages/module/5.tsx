import React from "react";
import { useRouter } from "next/router";
import Link from "next/link";

const Module5: React.FC = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
        {/* Back Button */}
        <div className="mb-4">
          <button
            onClick={() => router.push('/course-dashboard')}
            className="px-4 py-2 bg-gray-600 text-white font-bold rounded hover:bg-gray-700 transition"
          >
            Back to Course Dashboard
          </button>
        </div>

        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gold">Module 5: Debt Management Strategies</h1>
          <p className="text-gray-300 mt-2">
            Learn how to manage debt effectively using proven strategies like Debt Snowball and Debt Avalanche.
          </p>
        </header>

        {/* Overview Section */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">Overview</h2>
          <p className="text-gray-300">
            This module will help you understand how to manage your debt effectively. You will learn the difference between good debt and bad debt, and explore strategies for paying off debt using methods like the debt snowball and debt avalanche.
          </p>
        </section>

        {/* The Importance of Understanding Good vs. Bad Debt */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">Understanding Good Debt vs. Bad Debt</h2>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            <li><strong>Good Debt:</strong> Debt that helps you build wealth over time, like a mortgage or student loans.</li>
            <li><strong>Bad Debt:</strong> High-interest debt that hinders your financial progress, like credit card debt.</li>
          </ul>
        </section>

        {/* Debt-to-Income Ratio */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">Debt-to-Income Ratio (DTI)</h2>
          <p className="text-gray-300">
            Your DTI is the percentage of your income that goes toward debt payments. A lower DTI means you’re in a better position to manage and pay off debt.
          </p>
        </section>

        {/* Debt Snowball vs. Debt Avalanche Method */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">Debt Snowball vs. Debt Avalanche Method</h2>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            <li><strong>Debt Snowball:</strong> Focus on paying off the smallest debt first, then move to the next smallest. This method builds momentum.</li>
            <li><strong>Debt Avalanche:</strong> Focus on paying off the debt with the highest interest rate first. This saves you the most money in interest over time.</li>
          </ul>
        </section>

        {/* Strategies for Handling Different Types of Debt */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">Strategies for Handling Different Types of Debt</h2>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            <li><strong>Student Loans:</strong> Consider refinancing or consolidating loans to lower interest rates.</li>
            <li><strong>Credit Card Debt:</strong> Pay more than the minimum payment to avoid accumulating interest.</li>
            <li><strong>Mortgages:</strong> Consider making extra payments toward the principal to reduce interest and pay off the loan faster.</li>
          </ul>
        </section>

        {/* Key Takeaways */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">Key Takeaways</h2>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            <li>Understanding the difference between good and bad debt will help you make better financial decisions.</li>
            <li>The Debt Snowball and Debt Avalanche methods are powerful tools for paying off debt.</li>
            <li>Managing debt effectively frees up money for savings and investments.</li>
          </ul>
        </section>

        {/* Next Steps Section */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">Next Steps</h2>
          <p className="text-gray-300">
            Proceed to the next module, where we will discuss smart spending and how to avoid common financial mistakes.
          </p>
          <Link href="/module/6">
            <button className="mt-4 py-2 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition">
              Continue to Module 6
            </button>
          </Link>
        </section>

        {/* Downloadable Resource Section */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">Downloadable Resource</h2>
          <p className="text-gray-300">
            Download the <strong>Debt Management Tracker</strong> to help you monitor and manage your debt repayment strategy.
          </p>
          <a
            href="https://open.umn.edu/opentextbooks/textbooks/31"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Download Debt Management Tracker
          </a>
        </section>

        {/* Quiz Section */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">Quiz</h2>
          <p className="text-gray-300">Test your understanding of debt management strategies:</p>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            <li>Question 1: What is the main difference between the debt snowball and debt avalanche methods?</li>
            <li>A) Snowball focuses on paying off the highest interest rate debt first, while avalanche focuses on the smallest debt.</li>
            <li>B) Snowball focuses on the smallest debt first, while avalanche focuses on the highest interest rate.</li>
            <li>C) Both methods focus on the same type of debt.</li>
            <p className="text-green-500">Answer: B</p>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default Module5;