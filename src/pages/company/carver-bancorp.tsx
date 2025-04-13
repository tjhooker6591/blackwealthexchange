"use client";

import React from "react";
import Link from "next/link";
import Image from "next/legacy/image";
import { useRouter } from "next/router";

const CarverBancorp: React.FC = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-5xl mx-auto">
        {/* Navigation Bar */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
          >
            Back
          </button>
          <Link href="/company/urban-one">
            <button className="px-4 py-2 bg-gold text-black font-semibold rounded hover:bg-yellow-500 transition">
              Next
            </button>
          </Link>
        </div>

        {/* Header Section */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-gold mb-4">
            Carver Bancorp
          </h1>
          <p className="text-xl text-gray-300">
            Empowering Minority Banking and Community Finance.
          </p>
        </header>

        {/* About the Company */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gold mb-4">
            About Carver Bancorp
          </h2>
          <p className="mb-4 text-lg text-gray-300">
            Carver Bancorp is a leading financial institution focused on
            delivering innovative banking solutions to underserved communities.
            With a commitment to economic empowerment and financial inclusion,
            Carver Bancorp provides accessible banking services, loan products,
            and investment opportunities designed to uplift minority
            communities.
          </p>
          <p className="mb-4 text-lg text-gray-300">
            The company is deeply rooted in community development and has a
            proven track record of fostering economic growth through strategic
            partnerships and personalized financial services.
          </p>
          <div className="my-6">
            <Image
              src="/company/carver-bancorp.jpg" // Update with your actual image path
              alt="Carver Bancorp Headquarters"
              width={800}
              height={450}
              className="rounded-lg shadow-lg"
            />
          </div>
        </section>

        {/* Investment Opportunity */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gold mb-4">
            Investment Opportunity
          </h2>
          <p className="mb-4 text-lg text-gray-300">
            Investing in Carver Bancorp gives you the chance to support
            minority-focused banking initiatives while benefiting from a stable
            financial platform with long-term growth potential.
          </p>
          <ul className="list-disc list-inside mb-4 text-lg text-gray-300">
            <li>Publicly traded on major stock exchanges</li>
            <li>Innovative financial solutions for underserved markets</li>
            <li>Strong community focus and sustainable growth</li>
            <li>
              Consistent dividend payouts and capital appreciation potential
            </li>
          </ul>
          <p className="mb-4 text-lg text-gray-300">
            To invest in Carver Bancorp, follow these steps:
          </p>
          <ol className="list-decimal list-inside mb-4 text-lg text-gray-300">
            <li>Open a brokerage account with a reputable firm.</li>
            <li>Research the stock ticker symbol for Carver Bancorp.</li>
            <li>
              Place an order for shares at a price that fits your investment
              strategy.
            </li>
            <li>Monitor your investment and stay updated on company news.</li>
          </ol>
          <p className="mb-4 text-lg text-gray-300">
            Always conduct thorough research or consult a financial advisor
            before making investment decisions.
          </p>
        </section>

        {/* Additional Insights */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gold mb-4">
            Why Invest in Carver Bancorp?
          </h2>
          <p className="mb-4 text-lg text-gray-300">
            Carver Bancorp is dedicated to bridging the gap in access to capital
            for minority communities. Its innovative products, customer-centric
            approach, and strong community ties make it a unique investment
            opportunity for those looking to generate returns while making a
            positive social impact.
          </p>
          <ul className="list-disc list-inside mb-4 text-lg text-gray-300">
            <li>Commitment to economic empowerment and financial inclusion</li>
            <li>Solid financial performance and growth track record</li>
            <li>Innovative banking solutions that meet community needs</li>
            <li>Potential for attractive dividend yields</li>
          </ul>
        </section>

        {/* Call to Action */}
        <section className="text-center">
          <Link href="/investment">
            <button className="px-6 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-yellow-500 transition">
              Learn More About Investing in Carver Bancorp
            </button>
          </Link>
        </section>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>
            &copy; {new Date().getFullYear()} Carver Bancorp. All rights
            reserved.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default CarverBancorp;
