import React from "react";
import Link from "next/link";

export default function Module5() {
  return (
    <div className="min-h-screen bg-gray-900 text-white px-4 py-12">
      <div className="max-w-3xl mx-auto bg-gray-800 p-6 md:p-10 rounded-xl shadow-xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gold">
          Module 5: How to Get Started Step-by-Step
        </h1>
<p className="mb-7 text-lg text-gray-200">
  Ready to become an investor? This module gives you a simple, practical roadmap for building wealth from scratch—
  <span className="font-bold text-gold">no big savings or fancy knowledge required</span>.
  Start today, and your future self will thank you!
</p>


        {/* 1. Set Your Investment Goals */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2 text-blue-400">1. Set Your Investment Goals</h2>
          <p>
            <span className="text-gold font-semibold">What are you investing for?</span> Retirement, buying a home, childrens education, freedom? Clarity on your goals keeps you motivated and helps you choose the right strategy.
          </p>
          <ul className="list-disc ml-6 my-2 text-gray-100">
            <li>Short-term: 1–5 years (emergency fund, vacation, buying a car)</li>
            <li>Long-term: 5+ years (retirement, college fund, generational wealth)</li>
          </ul>
        </section>

        {/* 2. Choose the Right Account */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2 text-blue-400">2. Choose the Right Account</h2>
          <p>
            Your account type shapes your tax benefits, withdrawal rules, and more. Most beginners start with a <span className="text-gold font-semibold">brokerage account</span> (for flexibility) or a <span className="text-gold font-semibold">retirement account</span> (for tax breaks).
          </p>
          <ul className="list-disc ml-6 my-2 text-gray-100">
            <li><b>Brokerage Account:</b> General investing; cash out any time (taxes may apply)</li>
            <li><b>Retirement (IRA, Roth IRA, 401(k)):</b> For retirement savings, tax advantages</li>
            <li><b>Education (529 plan):</b> Save/invest for childrens college, tax benefits</li>
          </ul>
        </section>

        {/* 3. Pick a Platform or App */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2 text-blue-400">3. Pick a Platform or App</h2>
          <p>
            Investing has never been easier! You can start on your phone or laptop. Choose a platform based on user-friendliness, low fees, and investment choices. Top options for beginners include:
          </p>
          <ul className="list-disc ml-6 my-2 text-gray-100">
            <li>Fidelity, Schwab, Vanguard (classic full-service brokerages)</li>
            <li>Public, Robinhood, Acorns, Stash (easy apps for all levels)</li>
            <li>Look for automatic investing options—they help build a lasting habit!</li>
          </ul>
        </section>

        {/* 4. Fund Your Account */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2 text-blue-400">4. Fund Your Account</h2>
          <p>
            Link your bank, transfer in your first dollars (as little as $10–$50!), and set up auto-transfers. Consistency amount. Start small, but start now.
          </p>
        </section>

        {/* 5. Make Your First Investment */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2 text-blue-400">5. Make Your First Investment</h2>
          <p>
            Most beginners start with a broad index fund or ETF (like an S&P 500 fund)—you get instant diversification and growth potential. You can also choose a Black-owned company or a fund that fits your values!
          </p>
          <ul className="list-disc ml-6 my-2 text-gray-100">
            <li>Find “buy” or “trade” on your platform</li>
            <li>Enter the amount (fractional shares welcome!)</li>
            <li>Review and hit “confirm”</li>
          </ul>
          <p className="mt-2"><b>Pro Tip:</b> Don not wait to “know it all”—learn by doing and improve over time.</p>
        </section>

        {/* 6. Set Up Automatic Investing */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2 text-gold">6. Set Up Automatic Investing</h2>
          <p>
            Automate your investment every month or paycheck (“dollar-cost averaging”). This grows your portfolio steadily and removes the stress of “timing” the market.
          </p>
        </section>

        {/* 7. Monitor and Adjust */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2 text-blue-400">7. Monitor and Adjust (But Don not Obsess)</h2>
          <p>
            Check in every few months, not every day. Investing is a marathon, not a sprint! As your goals evolve, rebalance or add to your investments.
          </p>
        </section>

        {/* Action Steps */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-2 text-blue-400">Action Steps</h2>
          <ul className="list-disc ml-6 text-gray-100">
            <li>Open your first account—even a “practice” account is a win</li>
            <li>Set an automatic monthly deposit, even if it is $10</li>
            <li>Write your first goal and your “why” for investing</li>
          </ul>
        </section>

        {/* Key Takeaways */}
        <section className="mb-14">
          <h2 className="text-xl font-bold mb-2 text-gold">Key Takeaways</h2>
          <ul className="list-disc ml-6 text-gray-100">
            <li>Anyone can start investing—no matter your income or background</li>
            <li>Automatic investing + clear goals = lifelong wealth-building</li>
            <li>Be consistent, start small, and let time do the work</li>
          </ul>
        </section>

        {/* Navigation */}
        <div className="flex justify-between mt-10">
          <Link href="/courses/investing-for-beginners/module-4">
            <span className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-800 text-white cursor-pointer shadow">
              ← Previous
            </span>
          </Link>
          <Link href="/courses/investing-for-beginners/module-6">
            <span className="px-4 py-2 rounded bg-gold hover:bg-yellow-400 text-black font-bold shadow transition">
              Next: Supporting Black-Owned Businesses & Black Wealth →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
