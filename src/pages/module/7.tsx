import React from "react";
import { useRouter } from "next/router";
import Link from "next/link";

const Module7: React.FC = () => {
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
          <h1 className="text-3xl font-bold text-gold">Module 7: Building Healthy Financial Habits</h1>
          <p className="text-gray-300 mt-2">
            Learn how to maintain healthy financial habits that will support your long-term success.
          </p>
        </header>

        {/* Overview Section */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">Overview</h2>
          <p className="text-gray-300">
            In this module, you’ll learn the role discipline plays in maintaining financial health. We’ll also provide tips and strategies for building and sticking to healthy financial habits that will support your long-term success.
          </p>
        </section>

        {/* The Role of Discipline */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">The Role of Discipline in Maintaining Your Financial Health</h2>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            <li><strong>Building discipline is key to sticking to your budget, saving consistently, and avoiding debt.</strong></li>
            <li><strong>It’s about making intentional, long-term choices over short-term temptations. Practicing delayed gratification and focusing on your future will strengthen your financial health.</strong></li>
          </ul>
        </section>

        {/* How to Stick to Your Budget and Savings Plan */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">How to Stick to Your Budget and Savings Plan</h2>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            <li><strong>Set Realistic Goals:</strong> Break down your larger goals into manageable steps and track your progress.</li>
            <li><strong>Automate Savings:</strong> Set up automatic transfers to your savings or retirement account to make saving effortless.</li>
            <li><strong>Regularly Review Your Budget:</strong> Make adjustments to your budget if needed to align it with your current financial situation and goals.</li>
          </ul>
        </section>

        {/* Key Takeaways */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">Key Takeaways</h2>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            <li>Building financial discipline helps you avoid impulsive spending and ensures that you stay focused on your long-term financial goals.</li>
            <li>Regularly reviewing and adjusting your budget and savings plan will help you stay on track.</li>
            <li>Automating savings makes it easier to consistently save for the future.</li>
          </ul>
        </section>

        {/* Next Steps Section */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">Next Steps</h2>
          <p className="text-gray-300">
            Proceed to the next module, where we’ll explore the power of compound interest and how it can work for you.
          </p>
          <Link href="/module/8">
            <button className="mt-4 py-2 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition">
              Continue to Module 8
            </button>
          </Link>
        </section>

        {/* Downloadable Resource Section */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">Downloadable Resource</h2>
          <p className="text-gray-300">
            Download the <strong>Financial Habits Tracker</strong> to help you track and build good financial habits.
          </p>
          <a
            href="https://open.umn.edu/opentextbooks/textbooks/31"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Download Financial Habits Tracker
          </a>
        </section>

        {/* Quiz Section */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">Quiz</h2>
          <p className="text-gray-300">Test your understanding of building healthy financial habits:</p>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            <li>Question 1: What is one way to help you stick to your savings plan?</li>
            <li>A) Review your budget every few months</li>
            <li>B) Spend more on non-essential items</li>
            <li>C) Use credit cards to cover expenses</li>
            <p className="text-green-500">Answer: A</p>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default Module7;