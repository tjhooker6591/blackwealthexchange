import React from "react";
import Link from "next/link";

const RealEstateInvestment: React.FC = () => {
  return (
    <div className="bg-black text-white min-h-screen p-8">
      <div className="max-w-5xl mx-auto bg-gray-800 p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-gold">Black-Owned Real Estate & Investment Opportunities</h1>
        <p className="text-gray-300 mt-4">
          Explore rent-to-own options, connect with Black-owned real estate agencies, and find investment opportunities in Black real estate startups.
        </p>

        {/* Rent-to-Own Options Section */}
        <div className="mt-10 bg-gray-900 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gold">Rent-to-Own Options</h2>
          <p className="text-gray-300 mt-4">
            Learn about available rent-to-own housing options for African Americans, and how this can provide affordable pathways to homeownership.
          </p>
          <Link href="/rent-to-own">
            <button className="mt-4 px-6 py-3 bg-gold text-black font-bold rounded-lg hover:bg-yellow-500 transition">
              Learn More
            </button>
          </Link>
        </div>

        {/* Black-Owned Real Estate Agencies Section */}
        <div className="mt-10 bg-gray-900 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gold">Black-Owned Real Estate Agencies</h2>
          <p className="text-gray-300 mt-4">
            Find Black-owned real estate agencies that are committed to helping African Americans buy, sell, and rent properties.
          </p>
          <Link href="/black-owned-real-estate-agencies">
            <button className="mt-4 px-6 py-3 bg-gold text-black font-bold rounded-lg hover:bg-yellow-500 transition">
              Learn More
            </button>
          </Link>
        </div>

        {/* Real Estate Investment Opportunities Section */}
        <div className="mt-10 bg-gray-900 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gold">Real Estate Investment Opportunities</h2>
          <p className="text-gray-300 mt-4">
            Explore ways to invest in Black-owned real estate startups and businesses. Contribute to building Black wealth through property investments.
          </p>
          <Link href="/real-estate-investment">
            <button className="mt-4 px-6 py-3 bg-gold text-black font-bold rounded-lg hover:bg-yellow-500 transition">
              Learn More
            </button>
          </Link>
        </div>

        {/* Back to Homepage Button */}
        <div className="text-center mt-10">
          <Link href="/">
            <button className="px-6 py-3 bg-gold text-black font-bold rounded-lg hover:bg-yellow-500 transition">
              Back to Home
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RealEstateInvestment;