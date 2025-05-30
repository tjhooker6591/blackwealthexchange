import React from "react";
import Link from "next/link";

// Course Data (can be moved to a shared file if you wish)
const COURSE = {
  name: "Investing for Beginners: Build Wealth, Support Black-Owned Businesses, and Grow Your Future",
  price: 79,
  overview: (
    <>
      <p>
        This in-depth course introduces you to the fundamentals of investing—from stocks and bonds to real estate and gold. Learn proven steps to start investing, manage your portfolio, avoid costly mistakes, and make your money work for you. Discover unique ways to invest that empower Black excellence and support Black-owned businesses. This is more than just stocks: you’ll learn to build a future of wealth, freedom, and community impact!
      </p>
      <ul className="list-disc ml-6 mt-3">
        <li>Build and diversify your portfolio with confidence</li>
        <li>Master the basics of stocks, bonds, mutual funds, and alternative assets</li>
        <li>Understand risk, return, and how to align your investments with your goals</li>
        <li>Access unique Black-owned investment opportunities—including gold & silver</li>
        <li>Learn how to avoid the most common beginner mistakes</li>
      </ul>
      <p className="mt-3">
        Whether you’re starting with $10 or $10,000, this course makes investing accessible and impactful for you and your community!
      </p>
    </>
  ),
  learningOutcomes: [
    "Confidently explain stocks, bonds, mutual funds, ETFs, and real estate",
    "Set and pursue clear investment goals that support your life dreams",
    "Understand and manage investment risk for your situation",
    "Diversify and rebalance your portfolio like a pro",
    "Spot and access Black-owned companies, real estate, and alternative investments",
    "Begin investing in gold & silver with guidance from Black-owned firms",
    "Develop habits for lifelong investing success and wealth-building",
  ],
  modules: [
    "Module 1: Introduction to Investing & Why It Matters",
    "Module 2: Types of Investments (Stocks, Bonds, Funds, Real Estate, Alternatives)",
    "Module 3: The Power of Compound Growth",
    "Module 4: Risk, Return, and Building a Diversified Portfolio",
    "Module 5: How to Get Started Step-by-Step",
    "Module 6: Supporting Black-Owned Businesses & Black Wealth",
    "Module 7: Investing in Gold, Silver & Alternative Assets",
    "Module 8: Avoiding Common Mistakes",
    "Module 9: Tools & Resources for Black Investors",
  ],
};

const InvestingForBeginners: React.FC = () => {
  // (Payment logic coming soon, for now this is a static button)
  const handleEnroll = () => {
    // TODO: Connect to Stripe or payment/enrollment flow
    window.location.href = "/signup"; // Or show your Stripe/pay modal
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
        {/* Nav Buttons */}
        <div className="mb-4 flex gap-3">
          <Link href="/investment">
            <button
              aria-label="Go Back"
              className="px-4 py-2 bg-gray-600 text-white font-bold rounded hover:bg-gray-700 transition"
            >
              Go Back
            </button>
          </Link>
          <Link href="/">
            <button
              aria-label="Go to Home"
              className="px-4 py-2 bg-gold text-black font-bold rounded hover:bg-yellow-500 transition"
            >
              Home
            </button>
          </Link>
        </div>

        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gold">
            {COURSE.name}
          </h1>
        </header>

        {/* Course Overview */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">Course Overview</h2>
          <div className="mt-4 text-gray-300">{COURSE.overview}</div>
        </section>

        {/* Learning Outcomes */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">Learning Outcomes</h2>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            {COURSE.learningOutcomes.map((outcome, idx) => (
              <li key={idx}>{outcome}</li>
            ))}
          </ul>
        </section>

        {/* Course Modules */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">Course Modules</h2>
          <ul className="list-decimal ml-6 mt-4 text-gray-300">
            {COURSE.modules.map((mod, idx) => (
              <li key={idx}>{mod}</li>
            ))}
          </ul>
        </section>

        {/* Enrollment Section */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">Course Access</h2>
          <p className="mt-4 text-gray-300">
            <span className="font-bold text-gold">
              One-time Fee: ${COURSE.price}
            </span>
            <br />
            Pay once for lifetime access and future updates.
          </p>
          <div className="mt-4">
            <button
              onClick={handleEnroll}
              className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition font-bold"
            >
              Buy & Enroll
            </button>
          </div>
        </section>

        {/* --- ORIGINAL EDUCATION CONTENT --- */}
        {/* All your original content below, unchanged except formatting and order for flow */}

        {/* Why Invest */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-blue-500">
            Why Should You Invest?
          </h2>
          <ul className="list-disc ml-6 mt-4 text-gray-300 space-y-1">
            <li>
              <span className="text-gold">Build Wealth:</span> Grow your money and work towards financial freedom.
            </li>
            <li>
              <span className="text-gold">Beat Inflation:</span> Invest to keep your money growing faster than inflation.
            </li>
            <li>
              <span className="text-gold">Fund Your Goals:</span> Achieve dreams like buying a home, retiring, or starting a business.
            </li>
            <li>
              <span className="text-gold">Empower the Community:</span> Invest in Black-owned companies to support economic empowerment and close the wealth gap.
            </li>
          </ul>
        </section>

        {/* Types of Investments */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">
            Types of Investments
          </h2>
          <ul className="list-disc ml-6 mt-4 text-gray-300 space-y-2">
            <li>
              <span className="text-gold font-semibold">Stocks:</span> Ownership in a company. Consider Black-owned/led firms like{" "}
              <a
                href="https://www.urban1.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:underline"
              >
                Urban One, Inc.
              </a>
            </li>
            <li>
              <span className="text-gold font-semibold">Bonds:</span> Loans to companies or governments—typically safer, with lower returns.
            </li>
            <li>
              <span className="text-gold font-semibold">Mutual Funds & ETFs:</span> Pooled funds that let you invest in many stocks or bonds at once.
            </li>
            <li>
              <span className="text-gold font-semibold">Real Estate & REITs:</span> Buy property, or invest in real estate through funds. Consider supporting Black-owned real estate investment groups (search locally or check Black Enterprise lists).
            </li>
            <li>
              <span className="text-gold font-semibold">Gold & Silver:</span> Protect wealth by investing in precious metals. See resources below for Black-owned firms and educators.
            </li>
            <li>
              <span className="text-gold font-semibold">Commodities & Alternatives:</span> Includes things like agricultural products, art, and more.
            </li>
          </ul>
        </section>

        {/* Risk and Return */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">
            Understanding Risk & Return
          </h2>
          <ul className="list-disc ml-6 mt-4 text-gray-300 space-y-1">
            <li>
              <span className="text-gold">Risk:</span> Every investment comes with the possibility of loss. Stocks = higher risk, Bonds = lower risk.
            </li>
            <li>
              <span className="text-gold">Return:</span> Your profit or loss over time. Higher risk can mean higher reward—but also bigger losses.
            </li>
            <li>
              <span className="text-gold">Know Your Risk Tolerance:</span> Younger investors can often take more risk. Assess what you’re comfortable with.
            </li>
          </ul>
        </section>

        {/* Portfolio Management */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">
            Portfolio Management Basics
          </h2>
          <ul className="list-disc ml-6 mt-4 text-gray-300 space-y-1">
            <li>
              <span className="text-gold">Diversification:</span> Spread your money across different assets to reduce risk.
            </li>
            <li>
              <span className="text-gold">Asset Allocation:</span> Decide what % of your money goes to stocks, bonds, real estate, etc.
            </li>
            <li>
              <span className="text-gold">Rebalancing:</span> Adjust your portfolio over time to maintain your target allocation.
            </li>
          </ul>
        </section>

        {/* How to Start Investing */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">
            How to Start Investing: Step-by-Step
          </h2>
          <ol className="list-decimal ml-6 mt-4 text-gray-300 space-y-1">
            <li>Set clear financial goals</li>
            <li>Build an emergency fund first</li>
            <li>Open an investment account (brokerage or retirement)</li>
            <li>
              Choose your investments (consider Black-owned companies/funds!)
            </li>
            <li>Invest regularly (even small amounts add up!)</li>
            <li>Monitor and adjust your portfolio as needed</li>
          </ol>
        </section>

        {/* Investing in Black-Owned Businesses */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">
            Investing in Black-Owned Businesses
          </h2>
          <p className="mt-4 text-gray-300">
            <span className="text-gold font-semibold">Why?</span> Supporting Black-owned businesses helps close the racial wealth gap, creates jobs, and builds community wealth.
          </p>
          <ul className="list-disc ml-6 mt-4 text-gray-300 space-y-1">
            <li>
              <span className="text-gold">Publicly Traded:</span> Examples include Urban One, Carver Bancorp, and American Shared Hospital Services (Black-led).
            </li>
            <li>
              <span className="text-gold">Private Investment:</span> Use platforms like{" "}
              <a
                href="https://www.fundblackfounders.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:underline"
              >
                Fund Black Founders
              </a>
              ,{" "}
              <a
                href="https://www.blackconnect.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:underline"
              >
                Black Connect
              </a>
              , or search{" "}
              <a
                href="https://www.blackbusiness.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:underline"
              >
                Black Business
              </a>{" "}
              for opportunities.
            </li>
            <li>
              <span className="text-gold">Real Estate:</span> Join Black real estate investment clubs or REITs focused on minority communities (see Black Enterprise for lists).
            </li>
          </ul>
        </section>

        {/* Investing in Gold & Silver (with Black-Owned Firms) */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">
            Investing in Gold & Silver: The Black Wealth Approach
          </h2>
          <ul className="list-disc ml-6 mt-4 text-gray-300 space-y-1">
            <li>
              <span className="text-gold">Gold From The Soil</span> (
              <a
                href="https://www.goldfromthesoil.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:underline"
              >
                goldfromthesoil.com
              </a>
              ) – Black-owned, provides education and gold investment opportunities.
            </li>
            <li>
              <span className="text-gold">The Ivy Investor</span> (
              <a
                href="https://www.instagram.com/theivyinvestor/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:underline"
              >
                @theivyinvestor
              </a>
              ) – Black woman educator teaching about stocks, gold, silver, and wealth strategies.
            </li>
            <li>
              Ask local Black-owned jewelers and gold dealers about investment options or work with a trusted Black financial advisor specializing in alternative assets.
            </li>
          </ul>
        </section>

        {/* Common Mistakes */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">
            Common Mistakes to Avoid
          </h2>
          <ul className="list-disc ml-6 mt-4 text-gray-300 space-y-1">
            <li>Lack of research—always learn before you invest</li>
            <li>Chasing hype or “hot stocks”</li>
            <li>Emotional investing</li>
            <li>Ignoring fees or hidden costs</li>
            <li>Not supporting Black-owned or community-focused investments</li>
          </ul>
        </section>

        {/* Learn More: Black Financial Educators & Resources */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">Learn More</h2>
          <ul className="list-disc ml-6 mt-4 text-gray-300 space-y-2">
            <li>
              <span className="text-gold">Books by Black Authors:</span> <br />
              <strong>The Wealth Choice</strong> by Dr. Dennis Kimbro <br />
              <strong>Get Good With Money</strong> by Tiffany “The Budgetnista” Aliche <br />
              <strong>The Money Manual</strong> by Tonya Rapley
            </li>
            <li>
              <span className="text-gold">Online Education & Communities:</span>
              <ul className="ml-4 mt-2 space-y-1">
                <li>
                  <a
                    href="https://thebudgetnista.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold hover:underline"
                  >
                    The Budgetnista Academy
                  </a>{" "}
                  – Courses for budgeting, saving, and investing.
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
                  – Investing, gold/silver, and estate planning for Black families.
                </li>
                <li>
                  <a
                    href="https://www.empowerfinancialgroup.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold hover:underline"
                  >
                    Empower Financial Group
                  </a>{" "}
                  – Black-owned financial advisory and education firm.
                </li>
              </ul>
            </li>
            <li>
              <span className="text-gold">Podcasts & Channels:</span>
              <ul className="ml-4 mt-2 space-y-1">
                <li>
                  <a
                    href="https://www.earnyourleisure.com/podcast/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold hover:underline"
                  >
                    Earn Your Leisure Podcast
                  </a>{" "}
                  – Black wealth, investing, and entrepreneurship.
                </li>
                <li>
                  <a
                    href="https://www.youtube.com/@iamterrikarelle"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold hover:underline"
                  >
                    Trade and Travel (Terri Ijeoma)
                  </a>{" "}
                  – Learn about stocks and trading.
                </li>
              </ul>
            </li>
            <li>
              <span className="text-gold">
                Black Enterprise: Money Section:
              </span>
              <a
                href="https://www.blackenterprise.com/category/money/"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-gold hover:underline"
              >
                blackenterprise.com/money
              </a>{" "}
              – News, analysis, and inspiration.
            </li>
          </ul>
        </section>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <p>
            <Link
              href="/courses/personal-finance-101"
              className="text-gold hover:underline"
            >
              Personal Finance 101
            </Link>{" "}
            |{" "}
            <Link
              href="/courses/generational-wealth"
              className="text-gold hover:underline"
            >
              Building Generational Wealth
            </Link>
          </p>
          <p className="mt-4">
            <Link href="/contact" className="text-gold hover:underline">
              Contact Us
            </Link>{" "}
            |{" "}
            <Link href="/privacy-policy" className="text-gold hover:underline">
              Privacy Policy
            </Link>{" "}
            |{" "}
            <Link href="/terms-of-use" className="text-gold hover:underline">
              Terms of Use
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default InvestingForBeginners;
