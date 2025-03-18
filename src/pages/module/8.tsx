import React from "react";
import { useRouter } from "next/router";
import Link from "next/link";

const Module8: React.FC = () => {
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
            Module 8: The Power of Compound Interest
          </h1>
          <p className="text-gray-300 mt-2">
            Learn how compound interest can help grow your savings and
            investments over time, and strategies to maximize its benefits.
          </p>
        </header>

        {/* Overview Section */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">Overview</h2>
          <p className="text-gray-300">
            In this module, you will learn about compound interest and how it
            works to grow your savings and investments over time. We&rsquo;ll
            also discuss strategies for maximizing the benefits of compound
            interest.
          </p>
        </section>

        {/* Understanding How Compound Interest Works and Its Impact on Savings and Debt */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">
            Understanding How Compound Interest Works and Its Impact on Savings
            and Debt
          </h2>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            <li>
              <strong>Compound Interest:</strong> Interest earned on both the
              initial principal and the accumulated interest from previous
              periods. Over time, compound interest allows your savings to grow
              exponentially.
            </li>
            <li>
              <strong>Savings Example:</strong> If you invest $1,000 at an
              annual interest rate of 5%, you will earn $50 in interest in the
              first year. In the second year, you&rsquo;ll earn interest on $1,050,
              and so on. This process continues to accelerate the growth of your
              savings.
            </li>
            <li>
              <strong>Debt Example:</strong> Compound interest can also work
              against you in debt. For example, if you carry a balance on your
              credit card, interest is calculated not only on your principal
              balance but also on the interest charges that accumulate, making
              it harder to pay off the debt.
            </li>
          </ul>
        </section>

        {/* Strategies to Maximize Compound Interest in Savings */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">
            Strategies to Maximize Compound Interest in Savings
          </h2>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            <li>
              <strong>Start Early:</strong> The earlier you start saving and
              investing, the more time your money has to grow through
              compounding.
            </li>
            <li>
              <strong>Reinvest Earnings:</strong> Whenever you earn interest on
              savings or investments, reinvest that interest to take advantage
              of compound growth.
            </li>
            <li>
              <strong>Use Tax-Advantaged Accounts:</strong> Consider using
              retirement accounts like IRAs or 401(k)s to save on taxes and
              maximize compounded growth.
            </li>
          </ul>
        </section>

        {/* Key Takeaways Section */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">Key Takeaways</h2>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            <li>
              Compound interest is one of the most powerful tools for growing
              wealth over time.
            </li>
            <li>
              Starting early, reinvesting earnings, and using tax-advantaged
              accounts are key strategies for maximizing compound interest.
            </li>
            <li>
              Compound interest can also work against you in debt, which is why
              managing debt effectively is crucial.
            </li>
          </ul>
        </section>

        {/* Next Steps Section */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">Next Steps</h2>
          <p className="text-gray-300">
            Congratulations! You&rsquo;ve completed the course. Consider
            reviewing the material and starting to implement the strategies
            you&rsquo;ve learned. You can also explore other resources on our
            website to continue building your financial knowledge.
          </p>
          <Link href="/course-dashboard">
            <button className="mt-4 py-2 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition">
              Return to Course Dashboard
            </button>
          </Link>
        </section>

        {/* Downloadable Resource Section */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">
            Downloadable Resource
          </h2>
          <p className="text-gray-300">
            Download the <strong>Compound Interest Calculator</strong> to help
            you see how compound interest works with your own savings and
            investments.
          </p>
          <a
            href="https://www.example.com/compound-interest-calculator"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Download Compound Interest Calculator
          </a>
        </section>

        {/* Quiz Section */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">Quiz</h2>
          <p className="text-gray-300">
            Test your understanding of compound interest:
          </p>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            <li>Question 1: How does compound interest help savings grow?</li>
            <li>
              A) It&rsquo;s interest earned only on the initial principal
              amount.
            </li>
            <li>
              B) It&rsquo;s interest earned on both the initial principal and
              accumulated interest.
            </li>
            <li>C) It&rsquo;s interest earned only on interest payments.</li>
            <p className="text-green-500">Answer: B</p>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default Module8;
