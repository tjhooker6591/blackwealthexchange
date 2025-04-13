"use client";

import React from "react";
import Link from "next/link";
import Image from "next/legacy/image";
import { useRouter } from "next/router";

const AxsomeTherapeutics: React.FC = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-5xl mx-auto">
        {/* Navigation Bar */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
          >
            Back
          </button>
          <Link href="/company/broadway-financial">
            <button className="px-4 py-2 bg-gold text-black font-semibold rounded hover:bg-yellow-500 transition">
              Next
            </button>
          </Link>
        </div>

        {/* Header Section */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-gold mb-4">
            Axsome Therapeutics (AXSM)
          </h1>
          <p className="text-xl text-gray-300">
            Innovative Therapies for a Better Future in CNS Disorders.
          </p>
        </header>

        {/* About the Company */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gold mb-4">
            About Axsome Therapeutics
          </h2>
          <p className="mb-4 text-lg text-gray-300">
            Axsome Therapeutics is a pioneering biopharmaceutical company
            dedicated to developing novel treatments for central nervous system
            (CNS) disorders. Leveraging advanced research, cutting-edge
            technology, and strategic collaborations, Axsome is at the forefront
            of delivering transformative therapies that address significant
            unmet medical needs.
          </p>
          <p className="mb-4 text-lg text-gray-300">
            With a robust pipeline of investigational therapies and a commitment
            to innovation, Axsome Therapeutics is focused on improving the lives
            of patients through breakthrough treatments. Their comprehensive
            approach in drug development and clinical research positions them as
            a leader in the rapidly evolving field of CNS therapeutics.
          </p>
          <div className="my-6">
            <Image
              src="/company/axsome-therapeutics.jpg" // Ensure this image exists or update the path.
              alt="Axsome Therapeutics Headquarters"
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
            Investing in Axsome Therapeutics offers you the chance to be part of
            an innovative journey in the biopharmaceutical sector. As a publicly
            traded company, Axsome provides transparency, steady growth, and
            significant long-term potential for both individual and
            institutional investors.
          </p>
          <ul className="list-disc list-inside mb-4 text-lg text-gray-300">
            <li>Publicly traded on major stock exchanges</li>
            <li>Strong pipeline of novel CNS therapies</li>
            <li>Cutting-edge research and strategic partnerships</li>
            <li>Potential for substantial capital appreciation</li>
            <li>Commitment to improving patient outcomes</li>
          </ul>
          <p className="mb-4 text-lg text-gray-300">
            To invest in Axsome Therapeutics, follow these steps:
          </p>
          <ol className="list-decimal list-inside mb-4 text-lg text-gray-300">
            <li>
              Open or use an existing brokerage account with a reputable firm.
            </li>
            <li>
              Research the stock ticker symbol (AXSM) and review recent
              performance data.
            </li>
            <li>
              Place an order to purchase shares at a price that aligns with your
              investment strategy.
            </li>
            <li>
              Monitor your investment and stay informed on company developments
              and market trends.
            </li>
          </ol>
          <p className="mb-4 text-lg text-gray-300">
            Remember, all investments carry risks. It is recommended to consult
            with a financial advisor and conduct thorough research before making
            any investment decisions.
          </p>
        </section>

        {/* Additional Insights */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gold mb-4">
            Why Invest in Axsome Therapeutics?
          </h2>
          <p className="mb-4 text-lg text-gray-300">
            Axsome Therapeutics stands out for its innovative approach in
            addressing challenging CNS disorders. With a focus on breakthrough
            therapies, the company is not only advancing medical science but
            also driving long-term value for its shareholders. Key reasons to
            consider investing include:
          </p>
          <ul className="list-disc list-inside mb-4 text-lg text-gray-300">
            <li>Innovative pipeline with promising clinical data</li>
            <li>Experienced leadership and research teams</li>
            <li>Robust financial performance and growth potential</li>
            <li>Strategic partnerships with leading industry players</li>
            <li>Commitment to making a positive impact on patient care</li>
          </ul>
        </section>

        {/* Call to Action */}
        <section className="text-center">
          <Link href="/investment">
            <button className="px-6 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-yellow-500 transition">
              Learn More About Investing in AXSM
            </button>
          </Link>
        </section>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>
            &copy; {new Date().getFullYear()} Axsome Therapeutics. All rights
            reserved.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default AxsomeTherapeutics;
