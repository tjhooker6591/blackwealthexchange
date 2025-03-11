import React from "react";
import { useRouter } from "next/router";
import Link from "next/link";

const RealEstateInvestment = () => {
  const router = useRouter();

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Hero Section with Banner Image and Headline */}
      <section
        className="relative bg-gray-800 bg-cover bg-center p-20 text-center"
        style={{ backgroundImage: 'url(/images/blackrealstate.jpg)' }}
      >
        <div className="absolute top-0 left-0 w-full h-full bg-black opacity-50"></div> {/* Optional overlay */}
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gold leading-tight">
            Explore Black-Owned Real Estate Options and Investments
          </h1>
          <p className="text-lg md:text-xl mt-4 text-gray-300">
            Empowering the community to build wealth through real estate and investments.
          </p>
        </div>
      </section>

      {/* Back Button */}
      <div className="mt-6 text-center">
        <Link href="/">
          <button className="px-6 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-yellow-500 transition">
            Back to Home
          </button>
        </Link>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6">
        <div className="section bg-gray-800 p-6 my-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gold">1. Black-Owned Real Estate Agencies</h2>
          <p className="text-gray-300">
            Supporting Black-owned real estate agencies not only allows you to find your dream property but also contributes to the empowerment and success of the African American community.
          </p>

          <ul className="list-disc pl-6 text-gray-300 mt-4">
            <li>Residential real estate: Home buying, selling, and rentals.</li>
            <li>Commercial real estate: Offices, stores, and industrial spaces.</li>
            <li>Real estate consulting and wealth-building advice.</li>
          </ul>

          <p className="font-semibold text-gray-200 mt-4">
            <strong>Featured Agencies:</strong>
          </p>
          <ul className="text-gray-300">
            <li>
              <a href="https://blackrealestateagents.com/" target="_blank" className="text-gold hover:text-yellow-500">
                Black Real Estate Agents
              </a>
            </li>
            <li>
              <a href="https://homeandtexture.com/black-real-estate-agencies/" target="_blank" className="text-gold hover:text-yellow-500">
                Elite Realty Partners, Inc.
              </a>
            </li>
            <li>
              <a href="https://www.housedigest.com/760365/black-owned-real-estate-companies-you-need-to-know-about/" target="_blank" className="text-gold hover:text-yellow-500">
                H.J. Russell & Company
              </a>
            </li>
          </ul>
        </div>

        <div className="section bg-gray-800 p-6 my-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gold">2. Real Estate Investment Opportunities</h2>
          <p className="text-gray-300">
            Real estate investment is a powerful way to build long-term wealth. Explore various investment options that contribute to revitalizing neighborhoods and creating generational wealth.
          </p>

          <ul className="list-disc pl-6 text-gray-300 mt-4">
            <li><strong>Residential Properties:</strong> Invest in rental homes or multi-family units for steady passive income.</li>
            <li><strong>Commercial Properties:</strong> Diversify your portfolio with investments like office buildings, retail spaces, and industrial properties.</li>
            <li><strong>Real Estate Crowdfunding:</strong> Participate in pooled investments for larger projects, often with lower minimum contributions.</li>
          </ul>

          <p className="font-semibold text-gray-200 mt-4"><strong>How to Start:</strong></p>
          <ul className="list-disc pl-6 text-gray-300 mt-4">
            <li>Research neighborhoods and markets with growth potential.</li>
            <li>Connect with local real estate experts for property evaluations.</li>
            <li>Understand financing options, including traditional mortgages, hard money lending, and government-backed loans.</li>
          </ul>

          <p className="font-semibold text-gray-200 mt-4"><strong>Featured Investment Platforms:</strong></p>
          <ul className="text-gray-300 mt-4">
            <li>
              <a href="https://www.realtymogul.com/" target="_blank" className="text-gold hover:text-yellow-500">
                RealtyMogul
              </a>
            </li>
            <li>
              <a href="https://www.investopedia.com/the-best-real-estate-crowdfunding-sites-8761523" target="_blank" className="text-gold hover:text-yellow-500">
                Fundrise
              </a>
            </li>
          </ul>
        </div>

        <div className="section bg-gray-800 p-6 my-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gold">3. Real Estate Education and Resources</h2>
          <p className="text-gray-300">
            Knowledge is power. Access educational resources to understand how to navigate the real estate market, make informed investment decisions, and develop strategies to maximize your wealth.
          </p>

          <ul className="list-disc pl-6 text-gray-300 mt-4">
            <li>Basics of real estate investing.</li>
            <li>How to find and evaluate investment properties.</li>
            <li>Financing options for first-time homebuyers and seasoned investors.</li>
            <li>Importance of property management and maintaining investments.</li>
          </ul>

          <p className="font-semibold text-gray-200 mt-4"><strong>Resources:</strong></p>
          <ul className="text-gray-300 mt-4">
            <li>
              <a href="https://www.facebook.com/groups/594125164033273/" target="_blank" className="text-gold hover:text-yellow-500">
                Black Real Estate Network (BRN)
              </a>
            </li>
            <li>
              <a href="https://blackrealestateagents.com/black-mortgage-lenders/" target="_blank" className="text-gold hover:text-yellow-500">
                Black Real Estate Agents Directory
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RealEstateInvestment;