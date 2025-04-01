import Link from "next/link";
import Image from "next/image";
import React from "react";

// Define the props interface for the InvestmentCard component.
interface InvestmentCardProps {
  bgColor: string;
  title: string;
  description: string;
  link: string;
  linkLabel: string;
  iconSrc?: string;
  ariaLabel: string;
}

// Reusable Investment Card component
function InvestmentCard({
  bgColor,
  title,
  description,
  link,
  linkLabel,
  iconSrc,
  ariaLabel,
}: InvestmentCardProps) {
  return (
    <div
      className={`p-4 ${bgColor} font-semibold rounded-lg shadow-md transform transition hover:scale-105 hover:shadow-xl`}
    >
      {iconSrc && (
        <div className="flex justify-center mb-4">
          <Image src={iconSrc} alt={`${title} icon`} width={48} height={48} />
        </div>
      )}
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="mt-2 text-sm">{description}</p>
      <Link href={link}>
        <button
          aria-label={ariaLabel}
          className="mt-3 px-4 py-2 bg-black text-white rounded-lg hover:bg-opacity-90 transition"
        >
          {linkLabel}
        </button>
      </Link>
    </div>
  );
}

export default function Investment() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
        {/* Home Button */}
        <div className="mb-4">
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
          <h1 className="text-3xl font-bold text-gold">
            Investment & Financial Growth
          </h1>
          <p className="text-gray-300 mt-2">
            Empower Black businesses and individuals through strategic
            investments, funding, and wealth-building resources.
          </p>
        </header>

        {/* Filtering Navigation */}
        <nav className="mb-6">
          <ul className="flex flex-wrap justify-center gap-4">
            <li>
              <Link
                href="/investment/category/startup"
                className="px-3 py-1 border border-gold text-gold rounded hover:bg-gold hover:text-black transition"
              >
                Startup Funding
              </Link>
            </li>
            <li>
              <Link
                href="/investment/category/stocks"
                className="px-3 py-1 border border-gold text-gold rounded hover:bg-gold hover:text-black transition"
              >
                Stocks
              </Link>
            </li>
            <li>
              <Link
                href="/investment/category/real-estate"
                className="px-3 py-1 border border-gold text-gold rounded hover:bg-gold hover:text-black transition"
              >
                Real Estate
              </Link>
            </li>
          </ul>
        </nav>

        {/* 📌 Key Investment Areas */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InvestmentCard
            bgColor="bg-gold text-black"
            title="Startup Funding"
            description="Access funding opportunities, venture capital, and grants for Black-owned startups."
            link="/funding"
            linkLabel="Explore Funding"
            iconSrc="/icons/startup.png"
            ariaLabel="Explore Startup Funding"
          />
          <InvestmentCard
            bgColor="bg-blue-500"
            title="Black-Owned Stocks"
            description="Invest in publicly traded Black-owned companies and ETFs."
            link="/stocks"
            linkLabel="View Stocks"
            iconSrc="/icons/stocks.png"
            ariaLabel="View Stocks"
          />
          <InvestmentCard
            bgColor="bg-green-500"
            title="Community Crowdfunding"
            description="Support and invest in Black-led projects through community funding."
            link="/crowdfunding"
            linkLabel="Start Investing"
            iconSrc="/icons/crowdfunding.png"
            ariaLabel="Start Investing via Crowdfunding"
          />
          <InvestmentCard
            bgColor="bg-red-500"
            title="Real Estate Investments"
            description="Learn how to invest in real estate and build generational wealth."
            link="/real-estate"
            linkLabel="Learn More"
            iconSrc="/icons/realestate.png"
            ariaLabel="Learn More about Real Estate Investments"
          />
        </div>

        {/* 🔥 Exclusive Services Section (Financial Literacy) */}
        <div className="section bg-gray-900 p-6 my-6 rounded shadow-lg">
          <h2 className="text-2xl font-bold text-gold">
            Financial Literacy Courses
          </h2>
          <p className="mt-2 text-gray-300">
            Enhance your knowledge of personal finance, investing, and
            wealth-building strategies. Our courses are designed to empower the
            community and provide essential tools for financial independence.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {/* Course 1 */}
            <div className="course-card bg-gray-800 p-4 rounded shadow-lg text-center">
              <h3 className="text-lg font-semibold">Personal Finance 101</h3>
              <p className="mt-2 text-gray-400">
                Learn the basics of budgeting, saving, and managing money
                effectively.
              </p>
              <Link href="/course-enrollment">
                <button className="mt-4 p-2 bg-gold text-black font-bold rounded">
                  Enroll Now
                </button>
              </Link>
            </div>

            {/* Course 2 */}
            <div className="course-card bg-gray-800 p-4 rounded shadow-lg text-center">
              <h3 className="text-lg font-semibold">Investing for Beginners</h3>
              <p className="mt-2 text-gray-400">
                A beginner’s guide to stock market investing and portfolio
                management.
              </p>
              <Link href="/courses/investing-for-beginners">
                <button className="mt-4 p-2 bg-gold text-black font-bold rounded">
                  Enroll Now
                </button>
              </Link>
            </div>

            {/* Course 3 */}
            <div className="course-card bg-gray-800 p-4 rounded shadow-lg text-center">
              <h3 className="text-lg font-semibold">
                Building Generational Wealth
              </h3>
              <p className="mt-2 text-gray-400">
                Learn how to build lasting wealth and create financial
                opportunities for future generations.
              </p>
              <Link href="/courses/generational-wealth">
                <button className="mt-4 p-2 bg-gold text-black font-bold rounded">
                  Enroll Now
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* 💡 Financial Literacy Section */}
        <div className="mt-8 bg-gray-700 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-gold mb-4">
            Financial Literacy for Black Investors
          </h2>
          <p className="text-gray-300 mb-4">
            Financial literacy is key to making informed investment decisions
            and building long-term wealth. We believe in empowering Black
            communities with the knowledge and tools to navigate the financial
            landscape. Below are key topics that will guide you in your
            financial journey:
          </p>
          <ul className="list-disc pl-6 text-gray-300">
            <li>
              <strong>Building Wealth Through Investments:</strong> Learn how to
              create wealth through various investment vehicles like stocks,
              real estate, and businesses.
            </li>
            <li>
              <strong>Budgeting and Financial Planning:</strong> Learn how to
              manage your income, reduce expenses, and save for your future.
            </li>
            <li>
              <strong>Understanding Credit:</strong> Understand how credit works
              and how to use it responsibly to improve your financial health.
            </li>
            <li>
              <strong>Retirement Planning:</strong> Learn about the best ways to
              save for retirement and take advantage of employer-sponsored plans
              and individual retirement accounts (IRAs).
            </li>
            <li>
              <strong>Debt Management:</strong> Learn strategies to manage and
              eliminate debt while increasing your savings and investment
              capacity.
            </li>
          </ul>
          <Link href="/financial-literacy">
            <button
              aria-label="Learn more about Financial Literacy"
              className="mt-6 px-6 py-3 bg-purple-600 text-white font-semibold text-lg rounded-lg hover:bg-purple-700 transition"
            >
              Learn More
            </button>
          </Link>
        </div>

        {/* 💡 Premium Content CTA */}
        <div className="mt-8 text-center">
          <h2 className="text-xl font-bold text-gold">
            Unlock Advanced Investment Strategies
          </h2>
          <p className="text-gray-300">
            Join our premium community for exclusive insights.
          </p>
          <Link href="/pricing">
            <button
              aria-label="Upgrade to Premium"
              className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Upgrade to Premium
            </button>
          </Link>
        </div>

        {/* Testimonials Section */}
        <div className="mt-8 bg-gray-700 p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gold mb-2">Success Stories</h2>
          <p className="text-gray-300">
            &quot;Thanks to these investment opportunities, our startup grew by
            300% in just one year!&quot; -{" "}
            <span className="font-bold">Jane Doe</span>
          </p>
        </div>
      </div>
    </div>
  );
}
