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

const AffiliatePage: React.FC = () => {
  const [affiliateOffers, setAffiliateOffers] = useState<AffiliateOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAffiliateOffers() {
      const data: AffiliateOffer[] = [
        {
          id: 1,
          name: "Official Black Wall Street",
          url: "https://officialblackwallstreet.com/",
          description:
            "A platform dedicated to promoting Black-owned businesses across the country, offering a directory, reviews, and a map of Black-owned businesses.",
          categories: "General, Retail, Services",
          image: "/affiliate/black-wall-street.jpg",
        },
        {
          id: 2,
          name: "Buy From A Black Woman",
          url: "https://www.buyfromablackwoman.org/",
          description:
            "A nonprofit organization supporting Black women entrepreneurs by providing resources, a directory, and promoting awareness of their businesses.",
          categories: "Retail, Beauty, Services, Nonprofits",
          image: "/affiliate/buy-from-a-black-woman.jpg",
        },
        {
          id: 3,
          name: "Support Black Owned",
          url: "https://supportblackowned.com/",
          description:
            "A comprehensive business directory for Black-owned businesses in the U.S. and internationally, helping consumers find and support Black entrepreneurs.",
          categories: "General, Retail, Food, Tech, Services, Education",
          image: "/affiliate/support-black-owned.jpg",
        },
        {
          id: 4,
          name: "Black Business Owners (BBO)",
          url: "https://blackbusinessowners.com/",
          description:
            "A directory of Black-owned businesses around the world, providing easy navigation to help consumers support Black entrepreneurs.",
          categories: "General, Retail, Services, Professional",
          image: "/affiliate/black-business-owners.jpg",
        },
        {
          id: 5,
          name: "The Black-Owned Market",
          url: "https://www.theblackownedmarket.com/",
          description:
            "A marketplace where consumers can discover Black-owned brands and businesses, featuring everything from fashion to home goods.",
          categories: "Retail, Fashion, Beauty, Art, Home Goods",
          image: "/affiliate/black-owned-market.jpg",
        },
      ];
      setAffiliateOffers(data);
      setLoading(false);
    }
    fetchAffiliateOffers();
  }, []);

  const handleAffiliateClick = (offer: AffiliateOffer) => {
    console.log("Affiliate clicked:", offer);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        Loading offers...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-gold mb-4">
            Library of Black Resources & Affiliate Partnerships
          </h1>
          <p className="text-xl text-gray-300">
            Discover exclusive offers, directories, and platforms that empower and celebrate Black entrepreneurship.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Disclaimer: We may earn commissions on qualifying purchases.
          </p>
        </header>

        {/* Navigation */}
        <nav className="flex justify-between items-center mb-8">
          <button
            onClick={() => history.back()}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
          >
            Back
          </button>
          <Link href="/">
            <button className="px-4 py-2 bg-gold text-black font-semibold rounded hover:bg-yellow-500 transition">
              Home
            </button>
          </Link>
        </nav>

        {/* Affiliate Offers */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {affiliateOffers.map((offer) => (
            <div
              key={offer.id}
              className="bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-2xl transition duration-300"
            >
              <Image
                src={offer.image}
                alt={offer.name}
                width={400}
                height={250}
                className="rounded-md mb-4"
              />
              <h2 className="text-2xl font-bold mb-2">{offer.name}</h2>
              <p className="mb-4 text-gray-300">{offer.description}</p>
              <p className="mb-4 text-sm text-gray-500">Categories: {offer.categories}</p>
              <a
                href={offer.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleAffiliateClick(offer)}
                className="inline-block px-4 py-2 bg-gold text-black font-semibold rounded hover:bg-yellow-500 transition"
              >
                Visit Site
              </a>
            </div>
          ))}
        </section>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Black Wealth Exchange. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default AffiliatePage;
