"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";

const UrbanOne: React.FC = () => {
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
          <Link href="/company/american-shared-hospital-services">
            <button className="px-4 py-2 bg-gold text-black font-semibold rounded hover:bg-yellow-500 transition">
              Next
            </button>
          </Link>
        </div>

        {/* Header Section */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-gold mb-4">
            Urban One
          </h1>
          <p className="text-xl text-gray-300">
            Redefining Media and Communication in the Black Community.
          </p>
        </header>

        {/* About the Company */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gold mb-4">
            About Urban One
          </h2>
          <p className="mb-4 text-lg text-gray-300">
            Urban One is a leading media company that connects and empowers the Black community through diverse television, digital, and radio 
            platforms. With a focus on creating culturally relevant and engaging content, Urban One has become a trusted voice in shaping public 
            opinion and influencing social change.
          </p>
          <p className="mb-4 text-lg text-gray-300">
            The company is committed to innovation and excellence, delivering content that not only entertains but also informs and inspires its audience. 
            Urban One is dynamic approach has made it a leader in modern media, consistently reaching millions of viewers and listeners.
          </p>
          <div className="my-6">
            <Image
              src="/company/urban-one.jpg" // Update this image path as necessary
              alt="Urban One Headquarters"
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
            Investing in Urban One allows you to participate in a media revolution that champions diversity and culturally relevant storytelling. 
            As a publicly traded company, Urban One offers transparency, growth potential, and a diversified revenue stream across multiple media platforms.
          </p>
          <ul className="list-disc list-inside mb-4 text-lg text-gray-300">
            <li>Publicly traded on major stock exchanges</li>
            <li>Robust portfolio across television, digital, and radio</li>
            <li>Innovative content that resonates with a broad audience</li>
            <li>Strong track record of audience engagement and revenue growth</li>
          </ul>
          <p className="mb-4 text-lg text-gray-300">
            To invest in Urban One, consider these steps:
          </p>
          <ol className="list-decimal list-inside mb-4 text-lg text-gray-300">
            <li>Open a brokerage account with a reputable firm.</li>
            <li>Research the stock ticker symbol for Urban One and analyze its market performance.</li>
            <li>Place an order for shares based on your investment strategy.</li>
            <li>Monitor your investment and keep informed on industry trends and company updates.</li>
          </ol>
          <p className="mb-4 text-lg text-gray-300">
            Remember that investing in media companies involves market risks, so it is important to conduct thorough research or consult a financial advisor.
          </p>
        </section>

        {/* Additional Insights */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gold mb-4">
            Why Invest in Urban One?
          </h2>
          <p className="mb-4 text-lg text-gray-300">
            Urban One is focus on delivering culturally resonant content and its diversified media strategy provide significant growth opportunities. 
            By investing in Urban One, you support a platform that empowers the Black community and drives social impact through media innovation.
          </p>
          <ul className="list-disc list-inside mb-4 text-lg text-gray-300">
            <li>Exposure to a diversified media portfolio</li>
            <li>Strong brand recognition and loyal audience</li>
            <li>Opportunities for growth through digital innovation</li>
            <li>Consistent revenue growth and potential dividends</li>
          </ul>
        </section>

        {/* Call to Action */}
        <section className="text-center">
          <Link href="/investment">
            <button className="px-6 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-yellow-500 transition">
              Learn More About Investing in Urban One
            </button>
          </Link>
        </section>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Urban One. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default UrbanOne;
