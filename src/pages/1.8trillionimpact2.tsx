// Filename: 1.8trillionimpact.tsx
import React from 'react';
import Link from 'next/link';
import { DollarSign, ShoppingBag, Clock, PieChart, TrendingUp, Home, BarChart, Users } from "lucide-react";

export default function TrillionImpactPage() {
  return (
    <div className="relative min-h-screen text-white">
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-50"></div>
      <div className="relative z-10 p-6 space-y-8 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gold">Financial Literacy: Know your money grow your money. Level up your finances, level up your life.</h1>

        <div className="bg-gray-900 rounded-lg shadow-lg p-4 mb-8 overflow-hidden">
          <div className="flex items-center mb-4">
            <DollarSign className="w-8 h-8 mr-2 text-gold" />
            <h2 className="text-lg font-semibold text-gold mb-2">Estiamted $1.98 Trillion Impact of African American Spending 2025:</h2>
          </div>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Economic Contribution:</strong> African Americans contribute over $1.98 trillion annually to the U.S. economy.</li>
            <li><strong>Global Comparison:</strong> If considered a nation, this spending power would rank as the 4th largest GDP globally.</li>
          </ul>
        </div>

        <div className="bg-blue-600 p-6 rounded-lg">
          <div className="flex items-center mb-4">
            <ShoppingBag className="w-8 h-8 mr-2 text-black" />
            <h2 className="text-2xl font-semibold">Where Black Dollars Go:</h2>
          </div>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Retail & Fashion:</strong> Brands like Nike, Louis Vuitton, H&M, Gucci, and Adidas benefit heavily from Black consumer loyalty.</li>
            <li><strong>Beauty & Personal Care:</strong> Companies such as L’Oréal, Procter & Gamble, Unilever, Estée Lauder, and Johnson & Johnson profit from Black spending.</li>
            <li><strong>Technology & Entertainment:</strong> Giants like Apple, Netflix, Spotify, Samsung, Sony, and Amazon capture a significant share of Black dollars.</li>
            <li><strong>Fast Food & Dining:</strong> Companies such as McDonald’s, Starbucks, Chick-fil-A, KFC, and Taco Bell receive major support from Black consumers.</li>
          </ul>
        </div>

        <div className="bg-yellow-600 p-6 rounded-lg">
          <div className="flex items-center mb-4">
            <Clock className="w-8 h-8 mr-2 text-black" />
            <h2 className="text-2xl font-semibold">Wealth Leakage & Circulation:</h2>
          </div>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Circulation Time:</strong> The Black dollar stays in the Black community for only 6 hours, compared to 20 days in Jewish communities and 30 days in Asian communities.</li>
            <li><strong>Wealth Leakage:</strong> Most Black spending leaves the community, fueling external economies instead of building internal wealth.</li>
          </ul>
        </div>

        <div className="bg-green-600 p-6 rounded-lg">
          <div className="flex items-center mb-4">
            <TrendingUp className="w-8 h-8 mr-2 text-black" />
            <h2 className="text-2xl font-semibold">Reclaiming Black Economic Power:</h2>
          </div>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Buy Black:</strong> Prioritize Black-owned businesses to increase economic circulation.</li>
            <li><strong>Bank Black:</strong> Use Black-owned banks to build community wealth.</li>
            <li><strong>Invest Black:</strong> Fund Black entrepreneurs to grow Black enterprises.</li>
            <li><strong>Educate Black:</strong> Promote financial literacy and entrepreneurship.</li>
          </ul>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center mb-4">
            <BarChart className="w-8 h-8 mr-2 text-gold" />
            <h2 className="text-2xl font-semibold">How to Shift Economic Power:</h2>
          </div>
          <p className="text-lg">Shifting just 5-10% of Black consumer spending to Black-owned businesses can generate billions of dollars in community reinvestment. Here’s how you can help:</p>
          <ul className="list-disc pl-5 space-y-2 mt-4">
            <li>Support Black-owned businesses with your purchasing power.</li>
            <li>Advocate for policies that promote Black business growth.</li>
            <li>Educate future generations on wealth-building strategies.</li>
          </ul>
        </div>

        <div className="text-center py-6 bg-gray-900 rounded-lg p-6">
          <h2 className="text-3xl font-bold mb-4 text-gold">The Path Forward</h2>
          <p className="text-lg max-w-2xl mx-auto text-white">
            Shifting spending habits toward Black-owned enterprises will create jobs, foster generational wealth, and empower the Black community. African American spending power is transformative—when used strategically, it can drive self-sufficiency, prosperity, and long-lasting economic control.
          </p>
        </div>
        
        <div className="flex justify-center mt-8">
          <Link href="/" className="flex items-center px-6 py-3 bg-gold text-black text-lg font-semibold rounded-lg shadow hover:bg-yellow-500 transition">
            <Home className="w-6 h-6 mr-2" /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
