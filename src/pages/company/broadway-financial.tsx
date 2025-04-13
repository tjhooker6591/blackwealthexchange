"use client";

import React from "react";
import Link from "next/link";
import Image from "next/legacy/image";
import { useRouter } from "next/router";

const BroadwayFinancial: React.FC = () => {
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
          <Link href="/company/carver-bancorp">
            <button className="px-4 py-2 bg-gold text-black font-semibold rounded hover:bg-yellow-500 transition">
              Next
            </button>
          </Link>
        </div>

        {/* Header Section */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-gold mb-4">
            Broadway Financial
          </h1>
          <p className="text-xl text-gray-300">
            Empowering Financial Growth through Strategic Innovation.
          </p>
        </header>

        {/* About the Company */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gold mb-4">
            About Broadway Financial
          </h2>
          <p className="mb-4 text-lg text-gray-300">
            Broadway Financial is a leading publicly traded financial services
            company focused on delivering innovative solutions for wealth
            management, investment advisory, and strategic financing. With a
            rich history and a forward-thinking approach, Broadway Financial has
            built a reputation for excellence and integrity in the financial
            sector.
          </p>
          <p className="mb-4 text-lg text-gray-300">
            Leveraging advanced technology and a team of seasoned financial
            experts, the company provides tailored financial products and
            services designed to empower both individuals and businesses. Their
            commitment to customer success, combined with a robust market
            presence, positions them as a trusted partner in achieving financial
            growth.
          </p>
          <div className="my-6">
            <Image
              src="/company/broadway-financial.jpg" // Update with your actual image path
              alt="Broadway Financial Headquarters"
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
            Investing in Broadway Financial provides you the chance to be part
            of a dynamic and evolving financial landscape. As a publicly traded
            company, Broadway Financial offers transparency, consistent
            performance, and significant long-term potential for investors.
          </p>
          <ul className="list-disc list-inside mb-4 text-lg text-gray-300">
            <li>Publicly traded on major stock exchanges</li>
            <li>Diversified portfolio of financial services</li>
            <li>Innovative, technology-driven investment strategies</li>
            <li>Seasoned leadership with a clear vision</li>
            <li>Commitment to ethical and sustainable growth</li>
          </ul>
          <p className="mb-4 text-lg text-gray-300">
            To invest in Broadway Financial, consider the following steps:
          </p>
          <ol className="list-decimal list-inside mb-4 text-lg text-gray-300">
            <li>
              Open or use an existing brokerage account with a reputable firm.
            </li>
            <li>Research the stock ticker symbol for Broadway Financial.</li>
            <li>
              Place an order to purchase shares at a price that aligns with your
              investment strategy.
            </li>
            <li>
              Monitor your investment and keep updated on company news and
              financial reports.
            </li>
          </ol>
          <p className="mb-4 text-lg text-gray-300">
            Remember, all investments carry risks. It is advisable to consult
            with a financial advisor and perform thorough research before making
            any investment decisions.
          </p>
        </section>

        {/* Additional Insights */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gold mb-4">
            Why Invest in Broadway Financial?
          </h2>
          <p className="mb-4 text-lg text-gray-300">
            Broadway Financial stands out due to its strategic focus on
            innovation, customer-centric solutions, and sustainable growth. With
            a commitment to leveraging technology and market expertise, the
            company offers investors:
          </p>
          <ul className="list-disc list-inside mb-4 text-lg text-gray-300">
            <li>Exposure to a diversified financial services market</li>
            <li>
              Potential for steady dividend payouts and capital appreciation
            </li>
            <li>Access to innovative financial products and strategies</li>
            <li>Insightful leadership and robust governance</li>
            <li>A track record of stability and growth</li>
          </ul>
        </section>

        {/* Call to Action */}
        <section className="text-center">
          <Link href="/investment">
            <button className="px-6 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-yellow-500 transition">
              Learn More About Investing in Broadway Financial
            </button>
          </Link>
        </section>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>
            &copy; {new Date().getFullYear()} Broadway Financial. All rights
            reserved.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default BroadwayFinancial;
