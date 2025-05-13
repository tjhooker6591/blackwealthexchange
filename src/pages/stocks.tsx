// src/pages/stocks.tsx
"use client";

import React from "react";
import { useRouter } from "next/router";

interface CompanyInfo {
  title: string;
  slug: string;
  overview: string;
  highlights: string[];
  investSteps: string[];
}

export default function BlackOwnedStocks() {
  const router = useRouter();

  const companies: CompanyInfo[] = [
    {
      title: "RLJ Lodging Trust",
      slug: "rlj-lodging-trust",
      overview:
        "RLJ Lodging Trust is a leading hospitality-focused REIT founded in 2009 by Robert L. Johnson, operating upscale hotels and resorts under brands like Ritz-Carlton, Marriott, and Hyatt across the U.S.",
      highlights: [
        "Market Cap: ~$1.8 B (Q1 2025)",
        "Dividend Yield: ~5.2% (Quarterly distributions)",
        "Info Ratio: 0.75",
        "Debt/Equity: ~1.1x (lower leverage vs. peers)",
      ],
      investSteps: [
        "Open a brokerage account (e.g., Fidelity, Robinhood, Schwab)",
        "Search for ticker RLJ on the NYSE",
        "Place a buy order (market or limit) at your target price",
        "Consider a DRIP (Dividend Reinvestment Plan) to compound yields",
      ],
    },
    {
      title: "Urban One",
      slug: "urban-one",
      overview:
        "Urban One, Inc. is the largest African-American–owned media company in the U.S., operating 55 radio stations, the TV One network, and digital platforms focused on Black audiences.",
      highlights: [
        "Market Cap: ~$400 M (Q1 2025)",
        "Revenue: $420 M (FY 2024)",
        "Info Ratio: 0.62",
        "Dividend: None (reinvesting in growth)",
      ],
      investSteps: [
        "Look up ticker UONE on the NASDAQ",
        "Review earnings call transcripts and ad-revenue trends",
        "Buy shares in tranches to manage entry risk",
        "Monitor subscriber growth and digital engagement quarterly",
      ],
    },
    {
      title: "Carver Bancorp",
      slug: "carver-bancorp",
      overview:
        "Carver Bancorp, Inc. is a New York–based community bank founded in 1948, offering personal and commercial banking services with a mission to serve underserved neighborhoods.",
      highlights: [
        "Market Cap: ~$150 M (Q1 2025)",
        "Dividend Yield: ~2.8%",
        "Info Ratio: 0.41",
        "Loan Portfolio Growth: 8% YoY",
      ],
      investSteps: [
        "Enter ticker CARV on NASDAQ in your platform",
        "Review FDIC call reports for asset quality",
        "Place limit orders around book value (~$18/share)",
        "Hold for dividends and community bank re-rating",
      ],
    },
    {
      title: "Broadway Financial",
      slug: "broadway-financial",
      overview:
        "Broadway Financial Corporation is a Southern California community bank founded in 2006, specializing in commercial real estate and small-business lending.",
      highlights: [
        "Market Cap: ~$35 M (Q1 2025)",
        "Dividend Yield: ~1.5%",
        "Info Ratio: 0.35",
        "Non-Performing Loans: <1%",
      ],
      investSteps: [
        "Search BYFC on NASDAQ via your broker",
        "Evaluate community development metrics in investor decks",
        "Start with a small position due to micro-cap volatility",
        "Track net interest margin and deposit growth quarterly",
      ],
    },
    {
      title: "Axsome Therapeutics",
      slug: "axsome-therapeutics",
      overview:
        "Axsome Therapeutics, Inc. is a clinical-stage biopharma company developing therapies for CNS disorders such as depression, migraine, and Alzheimer’s disease.",
      highlights: [
        "Market Cap: ~$1.2 B (May 2025)",
        "Pipeline: 4 drugs in Phase II/III",
        "Info Ratio: 0.55",
        "Cash Runway: Through 2026",
      ],
      investSteps: [
        "Look up AXSM on NASDAQ in your brokerage",
        "Read FDA filings and clinical trial updates",
        "Use limit orders before key data readouts",
        "Cap biotech exposure to a small % of your portfolio",
      ],
    },
    {
      title: "American Shared Hospital Services",
      slug: "american-shared-hospital-services",
      overview:
        "American Shared Hospital Services provides imaging and oncology equipment leasing and services (MRI, CT) to hospitals nationwide, maintaining high utilization rates.",
      highlights: [
        "Market Cap: ~$200 M (Q1 2025)",
        "Dividend Yield: ~3.6%",
        "Info Ratio: 0.48",
        "Equipment Utilization: 92%",
      ],
      investSteps: [
        "Search ticker ASHS on the NYSE",
        "Review quarterly lease portfolio details",
        "Buy shares and consider dividend reinvestment",
        "Monitor equipment upgrade cycles for growth signals",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-5xl mx-auto bg-gray-800 p-6 rounded-lg border border-gold space-y-8">
        {/* Back Button */}
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 bg-gold text-black font-bold rounded hover:bg-yellow-500 transition"
        >
          ← Back to Home
        </button>

        {/* Header */}
        <header className="space-y-2">
          <h1 className="text-4xl font-bold text-gold">
            Black-Owned Publicly Traded Companies
          </h1>
          <p className="text-gray-300">
            Discover the financial health, community impact, and step-by-step investing
            guidance for each company.
          </p>
        </header>

        {/* Company Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {companies.map((company) => (
            <article
              key={company.slug}
              className="bg-gray-700 p-6 rounded-lg shadow-md flex flex-col"
            >
              <h2 className="text-2xl font-semibold text-blue-300">
                {company.title}
              </h2>
              <p className="mt-2 text-gray-300 flex-1">
                {company.overview}
              </p>

              <div className="mt-4">
                <h3 className="text-xl font-bold text-gold mb-2">
                  Key Highlights
                </h3>
                <ul className="list-disc list-inside text-gray-300 ml-4 space-y-1">
                  {company.highlights.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-4">
                <h3 className="text-xl font-bold text-gold mb-2">
                  How to Invest
                </h3>
                <ol className="list-decimal list-inside text-gray-300 ml-4 space-y-1">
                  {company.investSteps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}