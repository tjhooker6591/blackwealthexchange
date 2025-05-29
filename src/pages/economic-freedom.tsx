import React from "react";
import Link from "next/link";

const EconomicFreedom = () => {
  return (
    <div className="container mx-auto p-8 bg-black text-white border border-gold shadow-lg">
      {/* Page Title */}
      <h1 className="text-2xl font-extrabold text-center text-gold mb-4 uppercase animate-pulse">
        Breaking the Chains of Modern Economic Slavery
      </h1>

      {/* Introduction */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-yellow-500 border-b-2 border-gold pb-2">
          Introduction
        </h2>
        <p className="text-lg mt-4 leading-relaxed">
          African Americans spend{" "}
          <strong className="text-red-500">$1.9 trillion</strong> annually—more
          than the GDP of many nations. But ask yourself:{" "}
          <strong className="text-yellow-400">Where does this money go?</strong>{" "}
          Instead of strengthening our own communities, it overwhelmingly flows
          into white-owned businesses, continuing a cycle of financial
          dependency and economic disparity.{" "}
          <span className="text-red-500 font-bold">
            This is modern economic slavery.
          </span>
          This stops NOW.
        </p>
      </section>

      {/* Historical Context */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-yellow-500 border-b-2 border-gold pb-2">
          1. Historical Context of Economic Oppression
        </h2>

        <h3 className="text-2xl font-bold text-gold mt-6">
          Post-Emancipation Challenges
        </h3>
        <ul className="list-disc pl-8 text-lg text-gray-300 leading-relaxed">
          <li>
            <strong className="text-white">Freedmen&rsquo;s Bureau:</strong>{" "}
            Established in 1865 to help formerly enslaved Black Americans. It
            was **systematically defunded and dismantled** before it could fully
            support economic independence.
          </li>
          <li>
            <strong className="text-white">Jim Crow Laws:</strong> Enforced
            segregation, locked Black citizens out of economic opportunities,
            and created long-lasting disparities that still affect us today.
          </li>
        </ul>

        <h3 className="text-2xl font-bold text-gold mt-6">
          Destruction of Prosperous Black Communities
        </h3>
        <ul className="list-disc pl-8 text-lg text-gray-300 leading-relaxed">
          <li>
            <span className="text-red-500 font-bold">
              1921: Tulsa&rsquo;s Black Wall Street
            </span>
            —a thriving Black community was burned to the ground, hundreds were
            murdered, and generational wealth was erased overnight.
          </li>
          <li>
            <span className="text-red-500 font-bold">
              Rosewood, Florida (1923)
            </span>
            —a self-sufficient Black town was wiped out due to false accusations
            and racial violence.
          </li>
          <li>
            <span className="text-red-500 font-bold">
              Wilmington, North Carolina (1898)
            </span>
            —a violent coup destroyed Black political and economic power.
          </li>
        </ul>
      </section>

      {/* Cultural Exploitation */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-yellow-500 border-b-2 border-gold pb-2">
          2. Cultural Exploitation and Economic Disparities
        </h2>
        <p className="text-lg leading-relaxed text-gray-300">
          The world profits off Black culture—while we receive **nothing.**
        </p>
        <ul className="list-disc pl-8 text-lg text-gray-300 leading-relaxed">
          <li>
            <span className="text-yellow-400 font-bold">
              Music & Entertainment:
            </span>{" "}
            Black creators define global music and fashion—but white
            corporations collect the profits.
          </li>
          <li>
            <span className="text-yellow-400 font-bold">Fashion & Beauty:</span>{" "}
            Black beauty standards are monetized by non-Black brands, yet
            Black-owned beauty businesses struggle for funding.
          </li>
        </ul>
      </section>

      {/* Breaking the Cycle */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-yellow-500 border-b-2 border-gold pb-2">
          3. Breaking the Cycle: Strategies for Economic Empowerment
        </h2>
        <ul className="list-disc pl-8 text-lg text-gray-300 leading-relaxed">
          <li>
            <span className="text-green-400 font-bold">
              Reinvest in Black Businesses:
            </span>{" "}
            Spend your money where it matters—**in our community.**
          </li>
          <li>
            <span className="text-green-400 font-bold">
              Practice Group Economics:
            </span>{" "}
            Strengthen Black wealth by keeping dollars circulating within our
            community.
          </li>
          <li>
            <span className="text-green-400 font-bold">
              Push for Financial Literacy:
            </span>{" "}
            Educate yourself and others on **investing, property ownership, and
            wealth-building.**
          </li>
        </ul>
      </section>

      {/* The Role of Black Wealth Exchange */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-yellow-500 border-b-2 border-gold pb-2">
          4. The Role of Black Wealth Exchange
        </h2>
        <p className="text-lg leading-relaxed text-gray-300">
          **Black Wealth Exchange is not just a platform—it&rsquo;s a
          movement.** Our mission is to **empower Black communities** by
          creating a **space for wealth, knowledge, and success.**
        </p>
        <ul className="list-disc pl-8 text-lg text-gray-300 leading-relaxed">
          <li>**Redirect Spending**—Prioritize Black-owned businesses.</li>
          <li>
            **Build Financial Power**—Through investments, education, and
            property ownership.
          </li>
          <li>
            **Create Sustainable Wealth**—For our children and future
            generations.
          </li>
        </ul>
      </section>

      {/* Conclusion */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-yellow-500 border-b-2 border-gold pb-2">
          Conclusion
        </h2>
        <p className="text-lg leading-relaxed text-white font-bold text-center">
          **It&rsquo;s time to reclaim our financial power.**
        </p>
        ``
        <p className="text-lg text-gray-300 text-center font-semibold">
          Our wealth is being drained. Our culture is being stolen. Our
          communities are being left behind. But together, we have the power to
          change that.
        </p>
      </section>

      {/* Call to Action */}
      <div className="text-center my-8">
        <Link href="/signup">
          <button className="px-6 py-3 bg-red-600 text-white font-bold rounded-md text-lg hover:bg-red-700 shadow-lg transform hover:scale-105 transition">
            Take Action Now
          </button>
        </Link>
      </div>
    </div>
  );
};

export default EconomicFreedom;
