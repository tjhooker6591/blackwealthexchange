import React from 'react';
import Link from 'next/link';
import { DollarSign, ShoppingBag, Clock, TrendingUp, BarChart, Home } from 'lucide-react';

export default function TrillionImpactPage() {
  return (
    <div className="relative min-h-screen text-white">
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-50"></div>
      <div className="relative z-10 p-6 space-y-8 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gold">Where Black Dollars Go: The Financial Impact and Opportunities</h1>

        {/* The $1.98 Trillion Impact */}
        <div className="bg-gray-900 rounded-lg shadow-lg p-4 mb-8 overflow-hidden">
          <div className="flex items-center mb-4">
            <DollarSign className="w-8 h-8 mr-2 text-gold" />
            <h2 className="text-lg font-semibold text-gold mb-2">The $1.98 Trillion Impact of African American Spending (2025):</h2>
          </div>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Annual Economic Contribution:</strong> African Americans contribute over $1.98 trillion annually to the U.S. economy.</li>
            <li><strong>Global Comparison:</strong> If considered a nation, this spending power would rank as the 4th largest GDP globally, surpassing countries like Germany and Japan.</li>
            <li><strong>Retail & Consumer Influence:</strong> Black consumers drive a significant share of retail sales, with spending in categories like fashion, beauty, technology, and food making a huge impact.</li>
            <li><strong>Investment Potential:</strong> With a shift in where the money is spent, the potential for reinvestment into Black-owned businesses is massive, driving growth and job creation within the community.</li>
          </ul>
        </div>

        {/* Where Black Dollars Go */}
        <div className="bg-blue-600 p-6 rounded-lg">
          <div className="flex items-center mb-4">
            <ShoppingBag className="w-8 h-8 mr-2 text-black" />
            <h2 className="text-2xl font-semibold">Where Black Dollars Go:</h2>
          </div>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Retail & Fashion:</strong> Brands like Nike, Louis Vuitton, H&M, Gucci, and Adidas benefit heavily from Black consumer loyalty, yet reinvest little back into the community.</li>
            <li><strong>Beauty & Personal Care:</strong> Companies such as L’Oréal, Procter & Gamble, Unilever, Estée Lauder, and Johnson & Johnson profit from Black spending, while failing to support Black beauty entrepreneurs at similar levels.</li>
            <li><strong>Technology & Entertainment:</strong> Giants like Apple, Netflix, Spotify, Samsung, Sony, and Amazon capture a significant share of Black dollars but contribute little to Black empowerment or economic growth.</li>
            <li><strong>Fast Food & Dining:</strong> McDonald’s, Starbucks, Chick-fil-A, KFC, and Taco Bell benefit greatly from Black consumer dollars. Yet, much of the revenue circulates outside the community, hindering long-term growth.</li>
          </ul>
        </div>

        {/* Wealth Leakage */}
        <div className="bg-yellow-600 p-6 rounded-lg">
          <div className="flex items-center mb-4">
            <Clock className="w-8 h-8 mr-2 text-black" />
            <h2 className="text-2xl font-semibold">Wealth Leakage & Circulation:</h2>
          </div>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Circulation Time:</strong> The Black dollar stays in the Black community for only **6 hours**, compared to **20 days in Jewish communities** and **30 days in Asian communities**. This quick circulation drains economic potential.</li>
            <li><strong>Wealth Leakage:</strong> Most Black spending leaves the community, fueling external economies and preventing wealth from accumulating and circulating within Black neighborhoods.</li>
            <li><strong>Redistribution Potential:</strong> By reallocating just 5-10% of Black spending back into the community, billions of dollars can be reinvested in education, infrastructure, and entrepreneurship.</li>
            <li><strong>Actionable Fact:</strong> **Shifting just 5-10%** of Black consumer spending to Black-owned businesses could generate **$500 billion** in reinvestment into Black communities, leading to **$2.5 trillion** in long-term growth.</li>
          </ul>
        </div>

        {/* Reclaiming Power */}
        <div className="bg-green-600 p-6 rounded-lg">
          <div className="flex items-center mb-4">
            <TrendingUp className="w-8 h-8 mr-2 text-black" />
            <h2 className="text-2xl font-semibold">Reclaiming Black Economic Power:</h2>
          </div>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Buy Black:</strong> By prioritizing Black-owned businesses, we can increase economic circulation and foster job creation within our own communities.</li>
            <li><strong>Bank Black:</strong> Shifting financial deposits to Black-owned banks builds community wealth and strengthens local economies.</li>
            <li><strong>Invest Black:</strong> Direct investments into Black entrepreneurs and startups helps grow Black enterprises, leading to job creation and innovation.</li>
            <li><strong>Educate Black:</strong> Promoting financial literacy, entrepreneurship education, and investment awareness ensures long-term economic self-sufficiency.</li>
            <li><strong>Fact:</strong> If **10% of Black households** invested $50 a month into local Black businesses, it could result in **$4.2 billion in new revenue** each year.</li>
          </ul>
        </div>

        {/* How to Shift Economic Power */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center mb-4">
            <BarChart className="w-8 h-8 mr-2 text-gold" />
            <h2 className="text-2xl font-semibold">How to Shift Economic Power:</h2>
          </div>
          <p className="text-lg">
            Shifting just 5-10% of Black consumer spending to Black-owned businesses can generate billions of dollars in community reinvestment. Here’s how you can help:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-4">
            <li>Support Black-owned businesses with your purchasing power.</li>
            <li>Advocate for policies that promote Black business growth and equitable access to financing.</li>
            <li>Educate future generations on wealth-building strategies and the importance of supporting Black businesses.</li>
            <li><strong>Important Fact:</strong> The Black community's collective action can increase GDP by **$2 trillion** in the next decade if we redirect just **10%** of consumer spending back to Black businesses.</li>
          </ul>
        </div>

        {/* The Path Forward */}
        <div className="text-center py-6 bg-gray-900 rounded-lg p-6">
          <h2 className="text-3xl font-bold mb-4 text-gold">The Path Forward</h2>
          <p className="text-lg max-w-2xl mx-auto text-white">
            Shifting spending habits toward Black-owned enterprises will create jobs, foster generational wealth, and empower the Black community. African American spending power is transformative—when used strategically, it can drive self-sufficiency, prosperity, and long-lasting economic control. **The time to act is now!**
          </p>
        </div>

        {/* Back to Home */}
        <div className="flex justify-center mt-8">
          <Link href="/" className="flex items-center px-6 py-3 bg-gold text-black text-lg font-semibold rounded-lg shadow hover:bg-yellow-500 transition">
            <Home className="w-6 h-6 mr-2" /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}