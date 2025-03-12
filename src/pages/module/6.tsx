import React from "react";
import { useRouter } from "next/router";
import Link from "next/link";

const Module6: React.FC = () => {
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
            Module 6: Smart Spending and Avoiding Pitfalls
          </h1>
          <p className="text-gray-300 mt-2">
            Learn how to manage day-to-day spending without sacrificing your
            long-term financial goals.
          </p>
        </header>

        {/* Overview Section */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">Overview</h2>
          <p className="text-gray-300">
            This module will teach you how to manage day-to-day spending without
            sacrificing your long-term financial goals. You'll also learn how to
            avoid common financial mistakes that can hinder your financial
            progress.
          </p>
        </section>

        {/* Managing Day-to-Day Spending */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">
            How to Manage Day-to-Day Spending Without Sacrificing Your Future
            Financial Goals
          </h2>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            <li>
              <strong>Track Spending:</strong> Use budgeting apps or a manual
              log to keep track of your expenses and see where your money is
              going.
            </li>
            <li>
              <strong>Avoid Impulse Purchases:</strong> Follow the
              &ldquo;24-hour rule&rdquo;—wait 24 hours before making
              non-essential purchases to avoid impulse buying.
            </li>
            <li>
              <strong>Prioritize Needs Over Wants:</strong> Focus on covering
              your basic needs (housing, food, utilities) before spending money
              on wants (luxury items, entertainment).
            </li>
          </ul>
        </section>

        {/* Avoiding Common Financial Mistakes */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">
            Avoiding Common Financial Mistakes
          </h2>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            <li>
              <strong>Living Beyond Your Means:</strong> Avoid using credit
              cards for everyday expenses unless you can pay off the balance in
              full each month. Living beyond your means can lead to
              high-interest debt and financial strain.
            </li>
            <li>
              <strong>Ignoring Debt:</strong> Failing to manage your debt can
              lead to missed payments, fees, and damage to your credit score.
            </li>
            <li>
              <strong>Not Saving for the Future:</strong> Delaying savings for
              retirement or emergencies can leave you financially vulnerable
              later in life.
            </li>
          </ul>
        </section>

        {/* Key Takeaways */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">Key Takeaways</h2>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            <li>
              Smart spending allows you to enjoy life without compromising your
              long-term financial goals.
            </li>
            <li>
              Tracking expenses and avoiding impulse purchases helps keep your
              finances on track.
            </li>
            <li>
              By avoiding common financial mistakes, you&rsquo;ll avoid setbacks
              in building wealth and achieving your financial goals.
            </li>
          </ul>
        </section>

        {/* Next Steps Section */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">Next Steps</h2>
          <p className="text-gray-300">
            Continue to the next module, where we&rsquo;ll dive into building
            healthy financial habits that will keep you on track for long-term
            success.
          </p>
          <Link href="/module/7">
            <button className="mt-4 py-2 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition">
              Continue to Module 7
            </button>
          </Link>
        </section>

        {/* Downloadable Resource Section */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">
            Downloadable Resource
          </h2>
          <p className="text-gray-300">
            Download the <strong>Spending Tracker</strong> to help you track
            daily spending and identify areas where you can cut back.
          </p>
          <a
            href="https://open.umn.edu/opentextbooks/textbooks/31"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Download Spending Tracker
          </a>
        </section>

        {/* Quiz Section */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">Quiz</h2>
          <p className="text-gray-300">
            Test your understanding of saving for the future:
          </p>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            <li>Question 1: What is one way to avoid impulse purchases?</li>
            <li>A) Use credit cards for all purchases</li>
            <li>B) Wait 24 hours before making non-essential purchases</li>
            <li>C) Buy everything on sale</li>
            <p className="text-green-500">Answer: B</p>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default Module6;
