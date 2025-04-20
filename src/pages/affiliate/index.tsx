// src/pages/affiliate/index.tsx
import type { GetServerSideProps, NextPage } from "next";
import jwt from "jsonwebtoken";
import { parse } from "cookie";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Head from "next/head";
import Image from "next/image";

interface AffiliateOffer {
  id: number;
  name: string;
  url: string;
  description: string;
  categories: string;
  image: string;
}

interface JwtPayload {
  userId: string;
  accountType: string;
  iat: number;
  exp: number;
}

interface AffiliateProps {
  user: {
    id: string;
    accountType: string;
  };
}

const AffiliatePartnershipPage: NextPage<AffiliateProps> = ({ user: _user }) => {
  const [affiliateOffers, setAffiliateOffers] = useState<AffiliateOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data: AffiliateOffer[] = [
      {
        id: 1,
        name: "Official Black Wall Street",
        url: "https://officialblackwallstreet.com/",
        description: "A platform dedicated to promoting Black-owned businesses across the country.",
        categories: "General, Retail, Services",
        image: "/affiliate/black-wall-street.jpg",
      },
      {
        id: 2,
        name: "Buy From A Black Woman",
        url: "https://www.buyfromablackwoman.org/",
        description: "A nonprofit organization supporting Black women entrepreneurs.",
        categories: "Retail, Beauty, Services, Nonprofits",
        image: "/affiliate/buy-from-a-black-woman.jpg",
      },
      {
        id: 3,
        name: "Support Black Owned",
        url: "https://supportblackowned.com/",
        description: "A comprehensive directory for Black-owned businesses in the U.S. and internationally.",
        categories: "General, Retail, Food, Tech, Services, Education",
        image: "/affiliate/support-black-owned.jpg",
      },
      {
        id: 4,
        name: "Black Business Owners (BBO)",
        url: "https://blackbusinessowners.com/",
        description: "A directory of Black-owned businesses around the world.",
        categories: "General, Retail, Services, Professional",
        image: "/affiliate/black-business-owners.jpg",
      },
      {
        id: 5,
        name: "The Black-Owned Market",
        url: "https://www.theblackownedmarket.com/",
        description: "A marketplace where consumers can discover Black-owned brands.",
        categories: "Retail, Fashion, Beauty, Art, Home Goods",
        image: "/affiliate/black-owned-market.jpg",
      },
    ];
    setAffiliateOffers(data);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const steps = [
    { step: 1, title: "Sign Up", description: "Join as a content creator or influencer.", label: "Sign Up Now", path: "/affiliate/signup" },
    { step: 2, title: "Recommend", description: "Share curated affiliate links.", label: "Get Your Links", path: "/affiliate/recommend" },
    { step: 3, title: "Earn", description: "Earn competitive commissions.", label: "Start Earning", path: "/affiliate/earn" },
  ];

  return (
    <>
      <Head>
        <title>Affiliate &amp; Partnership Program | Black Wealth Exchange</title>
      </Head>
      <div className="min-h-screen bg-black text-white">
        {/* Intro Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gold mb-4">
            Empower Black Entrepreneurship
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8">
            Join our Affiliate &amp; Partnership Program to access exclusive opportunities and grow your business.
          </p>
          <a
            href="mailto:partners@blackwealthexchange.com"
            className="inline-block px-8 py-4 bg-gold text-black font-bold rounded hover:bg-yellow-500 transition-colors duration-200"
          >
            Join Our Partnership Program
          </a>
        </section>

        {/* How It Works */}
        <section className="container mx-auto px-4 py-12">
          <h2 className="text-4xl font-bold text-gold text-center mb-6">How It Works</h2>
          <p className="text-center text-xl text-gray-300 mb-12">
            Monetize your traffic and collaborate with us in three simple steps.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map(({ step, title, description, label, path }) => (
              <div
                key={step}
                className="bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300 text-center"
              >
                <div className="mb-4">
                  <span className="text-5xl text-gold">{step}</span>
                </div>
                <h3 className="text-2xl font-semibold text-gold mb-2">{title}</h3>
                <p className="text-gray-300 mb-4">{description}</p>
                <Link
                  href={path}
                  className="inline-block px-6 py-3 bg-gold text-black font-semibold rounded hover:bg-yellow-600 transition-colors duration-200"
                >
                  {label}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Affiliate Offers */}
        <section className="container mx-auto px-4 py-12">
          <h2 className="text-4xl font-bold text-gold text-center mb-6">Curated Affiliate Offers</h2>
          <p className="text-center text-xl text-gray-300 mb-12">Explore our hand-picked resources and products.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {affiliateOffers.map((offer) => (
              <div
                key={offer.id}
                className="bg-gray-800 p-4 rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300 flex flex-col"
              >
                <div className="w-full h-24 relative mb-4">
                  <Image src={offer.image} alt={offer.name} fill className="object-cover rounded-md" />
                </div>
                <h3 className="text-xl font-semibold text-gold mb-2">{offer.name}</h3>
                <p className="text-gray-300 mb-2 text-sm line-clamp-2">{offer.description}</p>
                <div className="mt-auto">
                  <a
                    href={offer.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block w-full text-center px-3 py-2 bg-gold text-black font-semibold rounded hover:bg-yellow-600 transition-colors duration-200"
                  >
                    Visit Site
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<AffiliateProps> = async ({ req }) => {
  const cookies = parse(req.headers.cookie || "");
  const token = cookies.session_token;

  if (!token) {
    return {
      redirect: {
        destination: "/login?next=/affiliate",
        permanent: false,
      },
    };
  }

  try {
    const secret = process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET!;
    const payload = jwt.verify(token, secret as string) as JwtPayload;

    return {
      props: {
        user: {
          id: payload.userId,
          accountType: payload.accountType,
        },
      },
    };
  } catch (err) {
    console.error("JWT verify failed", err);
    return {
      redirect: {
        destination: "/login?next=/affiliate",
        permanent: false,
      },
    };
  }
};

export default AffiliatePartnershipPage;
