"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface AffiliateOffer {
  id: number;
  name: string;
  url: string;
  description: string;
  categories: string;
  image: string;
}

const AffiliatePartnershipPage: React.FC = () => {
  const [affiliateOffers, setAffiliateOffers] = useState<AffiliateOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAffiliateOffers() {
      // Sample data – replace with your actual API data if available.
      const data: AffiliateOffer[] = [
        {
          id: 1,
          name: "Official Black Wall Street",
          url: "https://officialblackwallstreet.com/",
          description:
            "A platform dedicated to promoting Black-owned businesses across the country.",
          categories: "General, Retail, Services",
          image: "/affiliate/black-wall-street.jpg",
        },
        {
          id: 2,
          name: "Buy From A Black Woman",
          url: "https://www.buyfromablackwoman.org/",
          description:
            "A nonprofit organization supporting Black women entrepreneurs.",
          categories: "Retail, Beauty, Services, Nonprofits",
          image: "/affiliate/buy-from-a-black-woman.jpg",
        },
        {
          id: 3,
          name: "Support Black Owned",
          url: "https://supportblackowned.com/",
          description:
            "A comprehensive directory for Black-owned businesses in the U.S. and internationally.",
          categories: "General, Retail, Food, Tech, Services, Education",
          image: "/affiliate/support-black-owned.jpg",
        },
        {
          id: 4,
          name: "Black Business Owners (BBO)",
          url: "https://blackbusinessowners.com/",
          description:
            "A directory of Black-owned businesses around the world.",
          categories: "General, Retail, Services, Professional",
          image: "/affiliate/black-business-owners.jpg",
        },
        {
          id: 5,
          name: "The Black-Owned Market",
          url: "https://www.theblackownedmarket.com/",
          description:
            "A marketplace where consumers can discover Black-owned brands.",
          categories: "Retail, Fashion, Beauty, Art, Home Goods",
          image: "/affiliate/black-owned-market.jpg",
        },
      ];
      setAffiliateOffers(data);
      setLoading(false);
    }
    fetchAffiliateOffers();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero / Attract Section */}
      <section className="relative bg-gradient-to-r from-purple-800 to-indigo-700">
        {/* Optional patterned background overlay */}
        <div className="absolute inset-0">
          <Image
            src="/pattern.jpg" // Replace with your pattern image path
            alt="Pattern Background"
            fill
            className="object-cover opacity-30 pointer-events-none"
          />
        </div>
        <div className="relative z-10 container mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gold mb-4">
            Empower Black Entrepreneurship
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-8">
            Join our Affiliate & Partnership Program to access exclusive
            opportunities and grow your business.
          </p>
          <a
            href="mailto:partners@blackwealthexchange.com"
            className="inline-block px-8 py-4 bg-gold text-black font-bold rounded hover:bg-yellow-500 transition"
          >
            Join Our Partnership Program
          </a>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-4xl font-bold text-gold text-center mb-6">
          How It Works
        </h2>
        <p className="text-center text-xl text-gray-300 mb-12">
          Monetize your traffic and collaborate with us in three simple steps.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1: Sign Up */}
          <div className="bg-gray-800 p-6 rounded-lg shadow hover:shadow-xl transition text-center">
            <div className="mb-4">
              <span className="text-5xl text-gold">1</span>
            </div>
            <h3 className="text-2xl font-semibold text-gold mb-2">Sign Up</h3>
            <p className="text-gray-300 mb-4">
              Join our program as a content creator, publisher, or influencer.
            </p>
            <a
              href="mailto:partners@blackwealthexchange.com"
              className="inline-block px-6 py-3 bg-gold text-black font-semibold rounded hover:bg-yellow-500 transition"
            >
              Sign Up Now
            </a>
          </div>
          {/* Step 2: Recommend */}
          <div className="bg-gray-800 p-6 rounded-lg shadow hover:shadow-xl transition text-center">
            <div className="mb-4">
              <span className="text-5xl text-gold">2</span>
            </div>
            <h3 className="text-2xl font-semibold text-gold mb-2">Recommend</h3>
            <p className="text-gray-300 mb-4">
              Share our curated affiliate links with your audience.
            </p>
            <a
              href="mailto:partners@blackwealthexchange.com"
              className="inline-block px-6 py-3 bg-gold text-black font-semibold rounded hover:bg-yellow-500 transition"
            >
              Get Your Links
            </a>
          </div>
          {/* Step 3: Earn */}
          <div className="bg-gray-800 p-6 rounded-lg shadow hover:shadow-xl transition text-center">
            <div className="mb-4">
              <span className="text-5xl text-gold">3</span>
            </div>
            <h3 className="text-2xl font-semibold text-gold mb-2">Earn</h3>
            <p className="text-gray-300 mb-4">
              Earn competitive commissions from qualifying purchases.
            </p>
            <a
              href="mailto:partners@blackwealthexchange.com"
              className="inline-block px-6 py-3 bg-gold text-black font-semibold rounded hover:bg-yellow-500 transition"
            >
              Start Earning
            </a>
          </div>
        </div>
      </section>

      {/* Curated Affiliate Offers Section */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-4xl font-bold text-gold text-center mb-6">
          Curated Affiliate Offers
        </h2>
        <p className="text-center text-xl text-gray-300 mb-12">
          Explore our hand-picked selection of trusted resources and products.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {affiliateOffers.map((offer) => (
            <div
              key={offer.id}
              className="bg-gray-800 p-4 rounded-lg shadow hover:shadow-xl transition flex flex-col"
            >
              <div className="w-full h-24 relative mb-4">
                <Image
                  src={offer.image}
                  alt={offer.name}
                  fill
                  className="object-cover rounded-md"
                />
              </div>
              <h3 className="text-xl font-semibold text-gold mb-2">
                {offer.name}
              </h3>
              <p className="text-gray-300 mb-2 text-sm line-clamp-2">
                {offer.description}
              </p>
              <div className="mt-auto">
                <a
                  href={offer.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block w-full text-center px-3 py-2 bg-gold text-black font-semibold rounded hover:bg-yellow-500 transition"
                >
                  Visit Site
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Frequently Asked Questions Section */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-4xl font-bold text-gold text-center mb-6">
          Frequently Asked Questions
        </h2>
        <div className="space-y-8 max-w-4xl mx-auto">
          <div>
            <h3 className="text-2xl font-semibold text-gold">
              How does the Associates Program work?
            </h3>
            <p className="text-gray-300 mt-2">
              You can share products and available programs with your audience through customized linking tools and earn money on qualifying purchases and customer actions, such as signing up for a free trial.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-gold">
              How do I qualify for this program?
            </h3>
            <p className="text-gray-300 mt-2">
              Bloggers, publishers, and content creators with a qualifying website or mobile app can participate. If you are an influencer with an established social media following, explore the Amazon Influencer Program.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-gold">
              How do I earn in this program?
            </h3>
            <p className="text-gray-300 mt-2">
              You earn from qualifying purchases and programs through the traffic you drive. Commission income varies by product category and is paid approximately 60 days after the end of the month in which it was earned.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-gold">
              How do I sign up for the program?
            </h3>
            <p className="text-gray-300 mt-2">
              Sign up by clicking the button below. We will review your application and approve it if you meet the qualifying criteria.
            </p>
            <a
              href="mailto:partners@blackwealthexchange.com"
              className="inline-block mt-4 px-6 py-3 bg-gold text-black font-semibold rounded hover:bg-yellow-500 transition"
            >
              Sign Up Now
            </a>
          </div>
        </div>
      </section>

      {/* Back to Home Button */}
      <section className="text-center mt-10">
        <Link href="/">
          <button className="px-6 py-3 bg-gold text-black font-semibold text-lg rounded-lg hover:bg-yellow-500 transition">
            Back to Home
          </button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 py-4">
        <div className="container mx-auto text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Black Wealth Exchange. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default AffiliatePartnershipPage;
