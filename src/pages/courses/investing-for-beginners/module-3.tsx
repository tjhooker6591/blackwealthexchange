import React from "react";
import Link from "next/link";

export default function Module3() {
  return (
    <div className="min-h-screen bg-gray-900 text-white px-4 py-12">
      <div className="max-w-3xl mx-auto bg-gray-800 p-6 md:p-10 rounded-xl shadow-xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gold">
          Module 3: The Power of Compound Growth
        </h1>
        <p className="mb-7 text-lg text-gray-200">
          This module unlocks one of the **greatest secrets to building
          wealth:** <span className="text-gold font-bold">compound growth</span>
          . With compounding, even small, regular investments can become major
          wealth over time—no matter where you start. This is how everyday
          people, including our community, build true generational change.
        </p>

        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-2 text-blue-400">
            What Is Compound Growth?
          </h2>
          <p>
            <span className="text-gold font-bold">Compound growth</span> (or
            compounding) is when your money earns returns, and then those
            returns earn even more returns. Over time, it creates a “snowball”
            effect—your wealth grows much faster than with simple interest.
          </p>
          <div className="bg-black bg-opacity-60 rounded-lg shadow-lg p-4 my-4">
            <strong>Simple vs. Compound Interest Example:</strong>
            <ul className="list-disc ml-6 text-gray-100">
              <li>
                <b>Simple Interest:</b> $1,000 at 10% per year for 5 years ={" "}
                <span className="text-gold">$1,500</span>
              </li>
              <li>
                <b>Compound Interest:</b> $1,000 at 10% per year for 5 years ={" "}
                <span className="text-gold">$1,611</span>
              </li>
            </ul>
            <p className="text-gray-300 mt-2 text-sm">
              The more often you compound (monthly, annually), the greater the
              effect!
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-2 text-blue-400">
            How Compounding Builds Black Wealth
          </h2>
          <p>
            <span className="text-gold font-bold">
              Time is your biggest ally.
            </span>{" "}
            The sooner and more consistently you invest, the more powerful
            compounding becomes. Even small amounts, invested early, can grow
            into life-changing sums.
          </p>
          <div className="bg-black bg-opacity-60 rounded-lg shadow-lg p-4 my-4">
            <strong>Example:</strong>
            <ul className="list-disc ml-6 text-gray-100">
              <li>
                <span className="font-bold">Start at 25:</span> $100/month at 7%
                for 30 years ≈ <span className="text-gold">$121,000</span>
              </li>
              <li>
                <span className="font-bold">Start at 35:</span> $100/month at 7%
                for 20 years ≈ <span className="text-gold">$47,000</span>
              </li>
            </ul>
            <p className="text-gray-300 mt-2 text-sm">
              That’s a $74,000 difference—just from starting 10 years earlier!
            </p>
          </div>
          <p className="mt-2">
            <b>Key lesson:</b>{" "}
            <span className="text-gold">
              The best time to start investing was yesterday. The next best time
              is today.
            </span>
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-2 text-blue-400">
            The Rule of 72
          </h2>
          <p>
            The <span className="text-gold font-semibold">Rule of 72</span> is a
            fast way to estimate how long it will take your investment to
            double. Divide 72 by your annual rate of return.
          </p>
          <div className="bg-black bg-opacity-60 rounded-lg shadow-lg p-4 my-4">
            <strong>Example:</strong>
            <ul className="list-disc ml-6 text-gray-100">
              <li>
                <span className="font-bold">8% return:</span> 72 ÷ 8 ={" "}
                <span className="text-gold">9 years</span> to double your money.
              </li>
              <li>
                <span className="font-bold">12% return:</span> 72 ÷ 12 ={" "}
                <span className="text-gold">6 years</span> to double your money.
              </li>
            </ul>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold mb-2 text-gold">
            How to Maximize Compounding
          </h2>
          <ul className="list-disc ml-6 text-gray-200">
            <li>
              Start investing as early as possible—even small amounts matter.
            </li>
            <li>Invest consistently (every month or every paycheck).</li>
            <li>
              Reinvest your returns—don’t cash out dividends or interest if you
              can let it grow.
            </li>
            <li>
              Avoid withdrawing money early, so you don’t “break” the
              compounding effect.
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold mb-2 text-blue-400">Action Steps</h2>
          <ul className="list-disc ml-6 text-gray-200">
            <li>
              Use a{" "}
              <a
                href="https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:underline"
              >
                compound interest calculator
              </a>{" "}
              to see how your money could grow.
            </li>
            <li>
              Set up or increase automatic monthly investments, even if it’s
              just $10 or $25 to start.
            </li>
          </ul>
        </section>

        <section className="mb-14">
          <h2 className="text-xl font-bold mb-2 text-gold">Key Takeaways</h2>
          <ul className="list-disc ml-6 text-gray-100">
            <li>
              Compound growth is the “secret sauce” of investing—returns earn
              returns, creating exponential wealth.
            </li>
            <li>
              Start as early as you can, invest consistently, and let your money
              do the work.
            </li>
            <li>
              Even small, regular investments can grow to large sums over time.
            </li>
          </ul>
        </section>

        {/* Navigation */}
        <div className="flex justify-between mt-10">
          <Link href="/courses/investing-for-beginners/module-2">
            <span className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-800 text-white cursor-pointer shadow">
              ← Previous
            </span>
          </Link>
          <Link href="/courses/investing-for-beginners/module-4">
            <span className="px-4 py-2 rounded bg-gold hover:bg-yellow-400 text-black font-bold shadow transition">
              Next: Risk, Return & Diversification →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
