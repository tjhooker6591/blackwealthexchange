import React from "react";
import Link from "next/link";
import { Home } from "lucide-react";

const StartupFundingPage = () => {
  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-gold to-yellow-500 p-20 text-center">
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative z-10">
          <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight">
            Startup Funding for Black Entrepreneurs
          </h1>
          <p className="text-xl md:text-2xl mt-4 text-gray-300">
            Unlock funding opportunities to launch and grow your Black-owned
            startup. Learn about venture capital, grants, and alternative
            financing sources.
          </p>
        </div>
      </section>

      {/* Back Button */}
      <div className="mt-6 text-center">
        <Link href="/">
          <button className="px-6 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-yellow-500 transition">
            <Home className="w-6 h-6 mr-2" /> Back to Home
          </button>
        </Link>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6 space-y-8">
        {/* Introduction to Startup Funding */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 my-6">
          <h2 className="text-3xl font-bold text-gold mb-4">
            Introduction to Startup Funding for Black Entrepreneurs
          </h2>
          <p className="text-gray-300 mb-4">
            Starting and growing a business can be challenging, especially for
            Black entrepreneurs who often face significant barriers to accessing
            capital. However, there are a wide variety of funding opportunities
            available for Black-owned startups. From grants to venture capital,
            here&rsquo;s how you can unlock the resources needed to launch your
            business.
          </p>
          <p className="text-gray-300">
            Whether you&rsquo;re just getting started or looking to scale your
            operations, it&rsquo;s essential to understand the different types
            of funding options available and how to leverage them for your
            success.
          </p>
        </div>

        {/* Section 1: Funding Opportunities Overview */}
        <div className="bg-blue-600 rounded-lg shadow-lg p-6 my-6">
          <h2 className="text-3xl font-bold text-white mb-4">
            1. Types of Funding Opportunities for Black-Owned Startups
          </h2>
          <p className="text-gray-300 mb-4">
            There are several types of funding available for startups.
            Understanding the differences between these options can help you
            choose the right one for your business. Here&rsquo;s an overview of key
            funding types:
          </p>

          <h3 className="text-2xl font-bold text-white mb-2">
            Venture Capital (VC)
          </h3>
          <p className="text-gray-300 mb-4">
            Venture capital is a form of funding provided by investors to
            startups and small businesses that have high growth potential. In
            exchange for this funding, venture capitalists typically take an
            equity stake in the company. It&rsquo;s an ideal funding option for
            startups looking to scale quickly. However, securing VC funding can
            be challenging, especially for Black entrepreneurs, due to biases in
            the investment industry.
          </p>
          <p className="text-gray-300 mb-4">
            Here are some venture capital firms that focus on funding Black
            entrepreneurs:
          </p>
          <ul className="list-disc pl-6 text-gray-300">
            <li>
              <strong>
                <a
                  href="https://backstagecapital.com/"
                  target="_blank"
                  className="text-white hover:text-yellow-500"
                >
                  Backstage Capital
                </a>
              </strong>
              : A VC firm that invests in underrepresented founders, including
              Black entrepreneurs.
            </li>
            <li>
              <strong>
                <a
                  href="https://www.fearless.fund/"
                  target="_blank"
                  className="text-white hover:text-yellow-500"
                >
                  Fearless Fund
                </a>
              </strong>
              : Provides venture capital for Black women entrepreneurs to help
              them grow their businesses.
            </li>
            <li>
              <strong>
                <a
                  href="https://www.hbcuvc.org/"
                  target="_blank"
                  className="text-white hover:text-yellow-500"
                >
                  HBCUvc
                </a>
              </strong>
              : A nonprofit organization that trains Black students to enter the
              field of venture capital.
            </li>
          </ul>

          <h3 className="text-2xl font-bold text-white mb-2">
            Grants and Government Funding
          </h3>
          <p className="text-gray-300 mb-4">
            Grants are funds provided by the government or other organizations
            that don&rsquo;t need to be repaid. These funds are typically
            available to Black-owned startups that meet specific criteria, such
            as operating in certain sectors (e.g., technology, education, or
            healthcare). Government agencies and nonprofit organizations often
            offer grants to promote innovation and foster economic growth in
            underserved communities.
          </p>
          <p className="text-gray-300 mb-4">
            Some notable grants for Black-owned businesses include:
          </p>
          <ul className="list-disc pl-6 text-gray-300">
            <li>
              <strong>
                <a
                  href="https://www.sba.gov/funding-programs/grants"
                  target="_blank"
                  className="text-white hover:text-yellow-500"
                >
                  Small Business Administration (SBA) Grants
                </a>
              </strong>
              : Offers grants for various types of business development and
              community-focused initiatives.
            </li>
            <li>
              <strong>
                <a
                  href="https://www.comcastrise.com/"
                  target="_blank"
                  className="text-white hover:text-yellow-500"
                >
                  Comcast RISE Investment Fund
                </a>
              </strong>
              : Provides grants to Black-owned businesses, offering marketing
              services and media advertising.
            </li>
            <li>
              <strong>
                <a
                  href="https://ambergrantsforwomen.com/"
                  target="_blank"
                  className="text-white hover:text-yellow-500"
                >
                  Amber Grant
                </a>
              </strong>
              : A grant specifically for women of color entrepreneurs, providing
              funds to scale businesses.
            </li>
          </ul>

          <h3 className="text-2xl font-bold text-white mb-2">Crowdfunding</h3>
          <p className="text-gray-300 mb-4">
            Crowdfunding is another viable option for Black entrepreneurs to
            raise money. This funding model allows you to raise small amounts of
            money from a large number of people, typically through online
            platforms like Kickstarter, GoFundMe, or Indiegogo. It&rsquo;s a
            great way to test your business idea with real people and generate
            interest before scaling.
          </p>
          <p className="text-gray-300 mb-4">
            Some platforms to consider for crowdfunding include:
          </p>
          <ul className="list-disc pl-6 text-gray-300">
            <li>
              <strong>
                <a
                  href="https://www.kickstarter.com/"
                  target="_blank"
                  className="text-white hover:text-yellow-500"
                >
                  Kickstarter
                </a>
              </strong>
              : Fund your creative, tech, and community projects.
            </li>
            <li>
              <strong>
                <a
                  href="https://www.gofundme.com/"
                  target="_blank"
                  className="text-white hover:text-yellow-500"
                >
                  GoFundMe
                </a>
              </strong>
              : Popular for personal causes but also for community initiatives.
            </li>
            <li>
              <strong>
                <a
                  href="https://www.indiegogo.com/"
                  target="_blank"
                  className="text-white hover:text-yellow-500"
                >
                  Indiegogo
                </a>
              </strong>
              : A crowdfunding platform for startups, products, and new
              innovations.
            </li>
          </ul>
        </div>

        {/* Section 2: Navigating Venture Capital */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 my-6">
          <h2 className="text-3xl font-bold text-gold mb-4">
            2. Navigating Venture Capital for Black Startups
          </h2>
          <p className="text-gray-300 mb-4">
            Venture capital (VC) is often seen as the golden ticket to rapid
            growth, but securing VC funding can be a long and challenging
            process, particularly for Black entrepreneurs. VC firms typically
            invest in startups with high growth potential, and while they can
            provide substantial financial backing, they often come with certain
            expectations and challenges.
          </p>
          <h3 className="text-2xl font-bold text-white mb-2">
            How to Attract Venture Capital
          </h3>
          <p className="text-gray-300 mb-4">
            To successfully secure venture capital, Black entrepreneurs need to
            focus on the following:
          </p>
          <ul className="list-disc pl-6 text-gray-300">
            <li>
              <strong>Develop a Scalable Business Model:</strong> VCs are
              interested in businesses that can scale quickly. You&rsquo;ll need
              a strong business model and a unique value proposition that shows
              growth potential.
            </li>
            <li>
              <strong>Build a Solid Team:</strong> Investors look for a capable
              and experienced team. Surround yourself with knowledgeable people
              who can help execute your business plan.
            </li>
            <li>
              <strong>Network with Investors:</strong> Attend networking events,
              pitch competitions, and conferences to connect with investors who
              understand and support Black entrepreneurship.
            </li>
            <li>
              <strong>Prepare a Compelling Pitch:</strong> Your pitch should
              clearly explain your business, the problem it solves, the market
              opportunity, and your financial projections.
            </li>
          </ul>
        </div>

        {/* Section 3: Alternative Funding Options */}
        <div className="bg-yellow-600 rounded-lg shadow-lg p-6 my-6">
          <h2 className="text-3xl font-bold text-black mb-4">
            3. Alternative Funding Options for Black Entrepreneurs
          </h2>
          <p className="text-black mb-4">
            While venture capital and grants are fantastic sources of funding,
            there are other ways for Black entrepreneurs to raise capital. These
            alternatives can help diversify funding sources and expand business
            opportunities.
          </p>

          <h3 className="text-2xl font-bold text-black mb-2">Crowdfunding</h3>
          <p className="text-black mb-4">
            Crowdfunding is a powerful tool for raising small amounts of money
            from a large number of people. Platforms like Kickstarter, GoFundMe,
            and Indiegogo allow entrepreneurs to fund their projects by engaging
            with the community and getting support from people who believe in
            their vision.
          </p>

          <h3 className="text-2xl font-bold text-black mb-2">
            Angel Investors
          </h3>
          <p className="text-black mb-4">
            Angel investors are individuals who invest their personal funds into
            startups in exchange for equity. Angel investors can provide
            significant funding during the early stages of business growth, and
            many offer valuable mentorship and advice in addition to capital.
          </p>
        </div>

        {/* Conclusion */}
        <div className="text-center py-6 bg-gray-900 rounded-lg p-6">
          <h2 className="text-3xl font-bold mb-4 text-gold">
            Start Today – Empower Your Startup
          </h2>
          <p className="text-lg max-w-2xl mx-auto text-white">
            Building a successful Black-owned startup is not easy, but with the
            right resources and support, it is absolutely possible. By tapping
            into the right funding opportunities, including venture capital,
            grants, and alternative financing, Black entrepreneurs can build
            businesses that not only thrive but also contribute to the growth of
            their communities. The time to act is now—take control of your
            business&rsquo;s future and start securing the funding you need to
            bring your vision to life!
          </p>
        </div>
      </div>
    </div>
  );
};

export default StartupFundingPage;
