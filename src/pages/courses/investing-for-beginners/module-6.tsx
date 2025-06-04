import React from "react";
import Link from "next/link";

export default function Module6() {
  return (
    <div className="min-h-screen bg-gray-900 text-white px-4 py-12">
      <div className="max-w-3xl mx-auto bg-gray-800 p-6 md:p-10 rounded-xl shadow-xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gold">
          Module 6: Supporting Black-Owned Businesses & Black Wealth
        </h1>
        <p className="mb-7 text-lg text-gray-200">
          Investing isn’t just about personal gain—it’s a tool for <span className="text-gold font-bold">empowering our entire community</span>.
          In this module, discover how investing in and supporting Black-owned businesses multiplies our collective wealth, closes the racial wealth gap, and sets up generational progress for everyone.
        </p>

        {/* Why Support Black-Owned Businesses */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-2 text-blue-400">
            Why Support Black-Owned Businesses?
          </h2>
          <p>
            Every dollar spent at a Black-owned business keeps money circulating in our community, creates jobs, and builds up future leaders and entrepreneurs. 
            <span className="text-gold font-bold"> Supporting Black businesses is critical for collective wealth, representation, and generational opportunity.</span>
          </p>
          <ul className="list-disc ml-6 my-2 text-gray-100">
            <li>Black businesses hire locally, recycle profits in our neighborhoods, and often invest in social causes that matter.</li>
            <li>When these businesses thrive, they inspire others to start, invest, and build—creating a chain reaction of wealth and progress.</li>
          </ul>
        </section>

        {/* How to Invest in Black-Owned Businesses */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-2 text-blue-400">
            How to Invest in Black-Owned Businesses
          </h2>
          <ul className="list-disc ml-6 my-2 text-gray-100">
            <li>
              <span className="text-gold font-bold">Publicly Traded Companies:</span> 
              Some Black-owned or Black-led companies are listed on the stock market (e.g. Urban One, Carver Bancorp). Buying shares helps them grow and creates Black wealth in public markets.
            </li>
            <li>
              <span className="text-gold font-bold">Private Businesses & Startups:</span> 
              Many Black businesses aren’t public. Invest directly by joining local investment groups or via platforms focused on Black founders.
            </li>
            <li>
              <span className="text-gold font-bold">Crowdfunding Platforms:</span> 
              <a href="https://www.seedatthetable.com" target="_blank" rel="noopener noreferrer" className="underline text-yellow-400">Seed At The Table</a>,{" "}
              <a href="https://www.buytheblock.com" target="_blank" rel="noopener noreferrer" className="underline text-yellow-400">Buy The Block</a>, and{" "}
              <a href="https://www.fundblackfounders.com" target="_blank" rel="noopener noreferrer" className="underline text-yellow-400">Fund Black Founders</a> 
              let you invest in Black-owned startups and real estate projects directly.
            </li>
            <li>
              <span className="text-gold font-bold">Buy Black in Your Daily Life:</span> 
              Every purchase is an investment. Make a habit of shopping with Black-owned brands, restaurants, and services both locally and online.
            </li>
          </ul>
        </section>

        {/* Community Wealth-Building Models */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-2 text-blue-400">
            Community Wealth-Building Models
          </h2>
          <ul className="list-disc ml-6 text-gray-100">
            <li>
              <span className="text-gold font-bold">Investment Clubs:</span> 
              Join with friends, family, or community to pool funds, share ideas, and invest together for greater impact.
            </li>
            <li>
              <span className="text-gold font-bold">Cooperatives & Real Estate Crowdfunding:</span> 
              These models allow collective ownership—everyone wins as the business or property grows.
            </li>
            <li>
              <span className="text-gold font-bold">Mentoring & Sharing Knowledge:</span> 
              When you learn, teach. Helping others become investors multiplies wealth across the community.
            </li>
          </ul>
        </section>

        {/* Success Stories */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-2 text-blue-400">
            Success Stories & Inspiration
          </h2>
          <p>
            From neighborhood businesses to national tech startups, Black-owned ventures are making history. Through crowdfunding and clubs, families are buying real estate, funding college, starting new companies, and creating wealth that lasts for generations.
          </p>
        </section>

        {/* Action Steps */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-2 text-gold">Action Steps</h2>
          <ul className="list-disc ml-6 text-gray-200">
            <li>
              Find <span className="text-yellow-400 font-bold">one Black-owned business</span> to support or invest in this week (locally or online).
            </li>
            <li>
              Share a Black business or investing resource with friends or social media.
            </li>
            <li>
              Research a Black investment club or national crowdfunding opportunity and consider joining or sharing it with your circle.
            </li>
          </ul>
        </section>

        {/* Key Takeaways */}
        <section className="mb-14">
          <h2 className="text-xl font-bold mb-2 text-blue-400">Key Takeaways</h2>
          <ul className="list-disc ml-6 text-gray-100">
            <li>Investing in Black-owned businesses is one of the most powerful ways to close the racial wealth gap and build community prosperity.</li>
            <li>You can support through stocks, crowdfunding, direct investment, or simply buying Black every day.</li>
            <li>Collective models—investment clubs, co-ops, and mentoring—multiply the impact for everyone.</li>
          </ul>
        </section>

        {/* Navigation */}
        <div className="flex justify-between mt-10">
          <Link href="/courses/investing-for-beginners/module-5">
            <span className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-800 text-white cursor-pointer shadow">
              ← Previous
            </span>
          </Link>
          <Link href="/courses/investing-for-beginners/module-7">
            <span className="px-4 py-2 rounded bg-gold hover:bg-yellow-400 text-black font-bold shadow transition">
              Next: Investing in Gold, Silver & Alternative Assets →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

