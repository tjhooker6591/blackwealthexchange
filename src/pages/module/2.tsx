import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

const Module2: React.FC = () => {
  // States for Interactive Goal-Setting Tool
  const [goalAmount, setGoalAmount] = useState<number>(0);
  const [timeFrame, setTimeFrame] = useState<number>(0);
  const [monthlySavings, setMonthlySavings] = useState<number>(0);

  const router = useRouter();

  // Calculate Monthly Savings for goal
  const handleCalculate = () => {
    if (goalAmount && timeFrame) {
      setMonthlySavings(goalAmount / timeFrame);
    }
  };

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
            Module 2: Setting Financial Goals
          </h1>
          <p className="text-gray-300 mt-2">
            Set clear and achievable financial goals using the SMART framework.
          </p>
        </header>

        {/* Overview Section */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">Overview</h2>
          <p className="text-gray-300">
            In this module, you will learn the importance of setting both
            short-term and long-term financial goals, and how to create SMART
            goals to ensure that your financial plans are clear and achievable.
          </p>
        </section>

        {/* Real-Life Example */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">
            Real-Life Example
          </h2>
          <p className="text-gray-300">
          <p className="text-gray-300">
  Sarah, a 30-year-old professional, sets both short-term and long-term goals. She starts with saving 
  $1,000 for an emergency fund within 6 months (short-term), and then aims to save for a 20&percnt; 
  down payment on a house within 5 years (long-term).
</p>

          </p>
        </section>

        {/* Setting SMART Goals */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">
            Creating SMART Financial Goals
          </h2>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            <li>
              <strong>Specific:</strong> Make sure your goal is clearly defined
              (e.g., &quot;Save $5,000 for an emergency fund&quot;).
            </li>
            <li>
              <strong>Measurable:</strong> Track your progress (e.g., &quot;Save $500
              each month&quot;).
            </li>
            <li>
              <strong>Achievable:</strong> Ensure your goal is realistic based
              on your current financial situation.
            </li>
            <li>
              <strong>Relevant:</strong> <p className="text-gray-300">
  The goal should align with your overall financial and life objectives
   (e.g., &quot;Save for a down payment on a house&quot;).
</p>

            </li>
            <li>
              <strong>Time-bound:</strong> Set a clear deadline for achieving
              your goal (e.g., &quot;Save $5,000 in six months&quot;).
            </li>
          </ul>
        </section>

        {/* Motivation and Accountability */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">
            Motivation & Accountability
          </h2>
          <p className="text-gray-300">
            Setting goals is great, but staying motivated is key to achieving
            them. Here are some tips to stay on track:
          </p>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            <li>Set small rewards for each milestone you hit.</li>
            <li>
              Tell a friend or mentor about your goals to keep yourself
              accountable.
            </li>
            <li>
              Track your progress regularly and adjust your goals as needed.
            </li>
          </ul>
        </section>

        {/* Case Study */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">Case Study</h2>
          <p className="text-gray-300">
          <p className="text-gray-300">
  Meet James, who used SMART goals to pay off $5,000 in credit card debt within 1 year. 
  By making his goal specific (&quot;Pay off $5,000&quot;), measurable (&quot;tracking 
  monthly payments&quot;), achievable (&quot;budgeted 20&percnt; of income&quot;), and 
  time-bound (&quot;12 months&quot;), he was able to reduce his debt and gain financial freedom.
</p>

          </p>
        </section>

        {/* Interactive Goal-Setting Tool */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">
            Calculate Your Monthly Savings
          </h2>
          <div className="space-y-4">
            <div className="flex flex-col">
              <label htmlFor="goalAmount" className="text-gray-300">
                Goal Amount ($)
              </label>
              <input
                type="number"
                id="goalAmount"
                value={goalAmount}
                onChange={(e) => setGoalAmount(Number(e.target.value))}
                className="p-2 rounded-md bg-gray-700 text-white"
                placeholder="Enter your goal amount"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="timeFrame" className="text-gray-300">
                Time Frame (Months)
              </label>
              <input
                type="number"
                id="timeFrame"
                value={timeFrame}
                onChange={(e) => setTimeFrame(Number(e.target.value))}
                className="p-2 rounded-md bg-gray-700 text-white"
                placeholder="Enter time frame in months"
              />
            </div>
            <button
              onClick={handleCalculate}
              className="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Calculate Monthly Savings
            </button>
            {monthlySavings > 0 && (
              <p className="text-green-500 mt-4">
                To reach your goal, you need to save $
                {monthlySavings.toFixed(2)} per month.
              </p>
            )}
          </div>
        </section>

        {/* Key Takeaways */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">Key Takeaways</h2>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            <li>Setting financial goals provides direction and motivation.</li>
            <li>
              Use the SMART framework to ensure your goals are realistic and
              measurable.
            </li>
            <li>
              Short-term goals build momentum for achieving long-term financial
              success.
            </li>
          </ul>
        </section>

        {/* Next Steps */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">Next Steps</h2>
          <p className="text-gray-300">
            Proceed to the next module, where we will dive into how to create a
            budget that aligns with your financial goals.
          </p>
          <Link href="/module/3">
            <button className="mt-4 py-2 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition">
              Continue to Module 3
            </button>
          </Link>
        </section>

        {/* Downloadable Resource */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">
            Downloadable Resource
          </h2>
          <p className="text-gray-300">
            Download the <strong>Goal-Setting Template</strong> to set your own
            short-term and long-term financial goals.
          </p>
          <a
            href="https://open.umn.edu/opentextbooks/textbooks/31"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Download Goal-Setting Template
          </a>
        </section>

        {/* Quiz Section */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">Quiz</h2>
          <p className="text-gray-300">
            Test your understanding of SMART goal setting:
          </p>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            <li>
              Question 1: What does SMART stand for when setting financial
              goals?
            </li>
            <li>A) Specific, Manageable, Actionable, Relevant, Time-bound</li>
            <li>B) Specific, Measurable, Achievable, Relevant, Time-bound</li>
            <li>C) Simple, Measurable, Achievable, Reasonable, Time-bound</li>
            <p className="text-green-500">Answer: B</p>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default Module2;
