"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";

const AmericanSharedHospitalServices: React.FC = () => {
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
          <Link href="/company/axsome-therapeutics">
            <button className="px-4 py-2 bg-gold text-black font-semibold rounded hover:bg-yellow-500 transition">
              Next
            </button>
          </Link>
        </div>

        {/* Header Section */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-gold mb-4">
            American Shared Hospital Services (ASHS)
          </h1>
          <p className="text-xl text-gray-300">
            Transforming Healthcare Through Innovation and Community Care.
          </p>
        </header>

        {/* About the Company */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gold mb-4">
            About American Shared Hospital Services
          </h2>
          <p className="mb-4 text-lg text-gray-300">
            American Shared Hospital Services (ASHS) is a leading publicly
            traded company that provides comprehensive support services to
            hospitals and healthcare systems nationwide. With a focus on
            operational excellence and innovative technology, ASHS partners with
            healthcare providers to optimize facility management, streamline
            supply chains, and enhance revenue cycle management.
          </p>
          <p className="mb-4 text-lg text-gray-300">
            ASHS is committed to elevating the quality of care while reducing
            costs and improving efficiency in the healthcare industry. Their
            solutions integrate advanced analytics, state-of-the-art IT systems,
            and personalized support, making them a trusted partner for
            hospitals aiming to deliver superior patient care.
          </p>
          <div className="my-6">
            <Image
              src="/company/ashs-building.jpg" // Update with your image path
              alt="American Shared Hospital Services Headquarters"
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
            Investing in ASHS allows you to participate in a transformative
            movement within the healthcare industry. As a publicly traded
            company, ASHS offers transparency, stable growth, and robust
            financial performance.
          </p>
          <ul className="list-disc list-inside mb-4 text-lg text-gray-300">
            <li>Publicly traded on major stock exchanges</li>
            <li>Innovative, technology-driven support services</li>
            <li>Proven track record of operational excellence</li>
            <li>Strategic partnerships with top healthcare providers</li>
            <li>Commitment to community care and social responsibility</li>
          </ul>
          <p className="mb-4 text-lg text-gray-300">
            To invest in ASHS, consider the following steps:
          </p>
          <ol className="list-decimal list-inside mb-4 text-lg text-gray-300">
            <li>
              Open a brokerage account with a trusted financial institution.
            </li>
            <li>
              Research the stock ticker for ASHS and review its financial
              reports.
            </li>
            <li>
              Place an order for shares at a price aligned with your investment
              strategy.
            </li>
            <li>
              Regularly monitor your investment and stay updated on company news
              and market trends.
            </li>
          </ol>
          <p className="mb-4 text-lg text-gray-300">
            Remember, every investment comes with risk. It is advisable to
            consult a financial advisor and conduct in-depth research before
            investing.
          </p>
        </section>

        {/* Additional Insights */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gold mb-4">
            Why Invest in ASHS?
          </h2>
          <p className="mb-4 text-lg text-gray-300">
            ASHS stands out not only for it is innovative solutions in
            healthcare but also for its dedication to community and social
            impact. Investors benefit from:
          </p>
          <ul className="list-disc list-inside mb-4 text-lg text-gray-300">
            <li>Access to a growing healthcare support market</li>
            <li>Sustainable and cost-effective service models</li>
            <li>Commitment to improving patient outcomes</li>
            <li>Strong leadership with a proven vision for the future</li>
            <li>
              Potential for attractive dividend payouts and capital appreciation
            </li>
          </ul>
        </section>

        {/* Call to Action */}
        <section className="text-center">
          <Link href="/investment">
            <button className="px-6 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-yellow-500 transition">
              Learn More About Investing in ASHS
            </button>
          </Link>
        </section>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>
            &copy; {new Date().getFullYear()} American Shared Hospital Services.
            All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default AmericanSharedHospitalServices;
