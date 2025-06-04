import React from "react";
import Link from "next/link";

export default function Module8() {
  return (
    <div className="min-h-screen bg-gray-900 text-white px-4 py-12">
      <div className="max-w-3xl mx-auto bg-gray-800 p-6 md:p-10 rounded-xl shadow-xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gold">
          Module 8: Avoiding Common Mistakes
        </h1>
        <p className="mb-7 text-lg text-gray-200">
          Even experienced investors make mistakes. As a beginner, you can sidestep the most costly errors by learning from others—and staying focused on the long game. Here are the top pitfalls and how to dodge them for lasting wealth.
        </p>

        {/* Don't Panic */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-2 text-blue-400">Don’t Panic: Stay the Course</h2>
          <p>
            Markets rise and fall. Sometimes your investments will lose value—that’s normal. <span className="text-gold font-bold">Selling in a panic often locks in losses</span> right before things rebound.
          </p>
          <ul className="list-disc ml-6 my-2 text-gray-100">
            <li>Investing is a long-term journey. Don’t let short-term drops scare you out of your plan.</li>
            <li>History shows markets recover—patient, steady investors win.</li>
          </ul>
        </section>

        {/* Real-Life Mistakes Example */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-2 text-yellow-400">Real-Life Mistake: A Community Lesson</h2>
          <div className="bg-black bg-opacity-60 rounded-lg shadow-lg p-4">
            <p>
              <span className="text-gold font-bold">Jasmine’s Story:</span> Jasmine, a new Black investor from Atlanta, panicked when the market dropped in 2020 and sold all her stocks at a loss. A few months later, the market recovered—and the same investments she sold nearly doubled. Jasmine now invests consistently, uses a diversified portfolio, and is part of a Black investment club to learn from others and build generational wealth together.
            </p>
          </div>
          <p className="text-sm mt-2 text-gray-300">
            <span className="text-gold font-bold">Lesson:</span> Stay the course, seek out support, and learn from each experience—don’t go it alone!
          </p>
        </section>

        {/* FOMO */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-2 text-blue-400">Avoid FOMO & “Hot Tips”</h2>
          <p>
            Jumping on meme stocks, “can’t lose” crypto coins, or social media trends can backfire. Stick to your strategy and do your own research.
          </p>
          <ul className="list-disc ml-6 my-2 text-gray-100">
            <li>If it sounds too good to be true, it probably is.</li>
            <li>Never risk money you can’t afford to lose on “get rich quick” schemes.</li>
            <li><span className="text-yellow-400 font-bold">Pro Tip:</span> Follow real Black wealth educators (see our resource list!) not random TikTok tips.</li>
          </ul>
        </section>

        {/* Diversification */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-2 text-blue-400">Don’t Put All Your Eggs in One Basket</h2>
          <p>
            Failing to diversify is a classic beginner mistake. If one stock or investment fails, others help balance you out.
          </p>
          <ul className="list-disc ml-6 my-2 text-gray-100">
            <li>Diversify across stocks, bonds, funds, industries, and even countries when possible.</li>
          </ul>
        </section>

        {/* Fees & Taxes */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-2 text-blue-400">Watch Out for High Fees & Taxes</h2>
          <p>
            Fees can quietly eat into your profits, and not planning for taxes can lead to unwanted surprises. <span className="text-gold font-bold">Low-cost index funds and ETFs</span> are your friend.
          </p>
          <ul className="list-disc ml-6 my-2 text-gray-100">
            <li>Compare expense ratios before picking funds.</li>
            <li>Ask your platform about all charges—no hidden commissions.</li>
            <li>Know how your gains will be taxed (use tax-advantaged accounts if you can).</li>
          </ul>
        </section>

        {/* Timing */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-2 text-blue-400">Don’t Wait for the “Perfect” Time</h2>
          <p>
            Waiting for the “perfect” moment often means never getting started. <span className="text-gold font-bold">Start now</span>, even if it’s small.
          </p>
          <ul className="list-disc ml-6 my-2 text-gray-100">
            <li>Consistent investing beats trying to time the market.</li>
            <li>Set up automatic contributions so you never have to “guess” the right day.</li>
          </ul>
        </section>

        {/* Keep Learning */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-2 text-blue-400">Never Stop Learning</h2>
          <p>
            The most successful investors keep learning, growing, and adapting. Connect with other Black investors, join online communities, and stay curious.
          </p>
        </section>

        {/* Action Steps */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-2 text-gold">Action Steps</h2>
          <ul className="list-disc ml-6 text-gray-200">
            <li>Write down one mistake you want to avoid—and your plan to sidestep it.</li>
            <li>Set a calendar reminder every quarter to review your investments and keep learning.</li>
          </ul>
        </section>

        {/* Key Takeaways */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-2 text-blue-400">Key Takeaways</h2>
          <ul className="list-disc ml-6 text-gray-100">
            <li>Staying calm, consistent, and diversified helps you avoid most costly mistakes.</li>
            <li>Don’t let fear, hype, or “hot tips” drive your decisions—build wealth your way.</li>
            <li>Start now, use low-cost investments, and keep building your knowledge for long-term success.</li>
          </ul>
        </section>

        {/* Black Investing Communities & Resources */}
        <section className="mb-14">
          <h2 className="text-xl font-bold mb-2 text-yellow-400">Black Investing Communities & Resources</h2>
          <ul className="list-disc ml-6 text-gray-100">
            <li>
              <a
                href="https://www.earnyourleisure.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:underline"
              >
                Earn Your Leisure
              </a>{" "}
              – Wealth, investing, and business for the culture
            </li>
            <li>
              <a
                href="https://www.instagram.com/theivyinvestor/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:underline"
              >
                The Ivy Investor
              </a>{" "}
              – Black woman educator on stocks, gold/silver, and estate planning
            </li>
            <li>
              <a
                href="https://www.thebudgetnista.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:underline"
              >
                The Budgetnista
              </a>{" "}
              – Community, books, and courses on financial freedom
            </li>
            <li>
              <a
                href="https://www.blackinvestorsgroup.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:underline"
              >
                Black Investors Group (BIG)
              </a>{" "}
              – Investing clubs, events, and education
            </li>
            <li>
              <a
                href="https://www.blackenterprise.com/category/money/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:underline"
              >
                Black Enterprise: Money Section
              </a>{" "}
              – News, inspiration, and investing tools
            </li>
          </ul>
        </section>

        {/* Navigation */}
        <div className="flex justify-between mt-10">
          <Link href="/courses/investing-for-beginners/module-7">
            <span className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-800 text-white cursor-pointer shadow">
              ← Previous
            </span>
          </Link>
          <Link href="/courses/investing-for-beginners/module-9">
            <span className="px-4 py-2 rounded bg-gold hover:bg-yellow-400 text-black font-bold shadow transition">
              Next: Tools & Resources for Black Investors →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

