// src/pages/affiliate/index.tsx
"use client";

import type { NextPage } from "next";
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

const AffiliatePartnershipPage: NextPage = () => {
  const [affiliateStatus, setAffiliateStatus] = useState<
    "loading" | "active" | "inactive"
  >("loading");
  const [affiliateOffers, setAffiliateOffers] = useState<AffiliateOffer[]>([]);

  useEffect(() => {
    const checkAffiliate = async () => {
      try {
        const sessionRes = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });
        if (!sessionRes.ok) {
          setAffiliateStatus("inactive");
          return;
        }
        const sessionData = await sessionRes.json();

        if (!sessionData.user) {
          setAffiliateStatus("inactive");
          return;
        }

        const linksRes = await fetch(
          `/api/affiliate/get-links?userId=${sessionData.user.userId}`,
          {
            cache: "no-store",
            credentials: "include",
          },
        );
        if (linksRes.ok) {
          setAffiliateStatus("active");
        } else {
          setAffiliateStatus("inactive");
        }
      } catch (err) {
        console.error(err);
        setAffiliateStatus("inactive");
      }
    };

    checkAffiliate();

    const data: AffiliateOffer[] = [
      {
        id: 1,
        name: "Titanear Productions",
        url: "https://www.instagram.com/titaneraoffical/",
        description:
          "Titanera Productions | Filmmaker | Storyteller | Bringing epic tales.",
        categories: "Film, Movies, Services",
        image: "/titanearads.jpg",
      },
      {
        id: 2,
        name: "Pamfa United Citizens",
        url: "https://www.instagram.com/pamfaunitedcitizens/?hl=en/",
        description:
          "American Fashion Luxury Brand Atlanta and Los Angeles based, Black owned entrepreneurs.",
        categories: "Retail, fashion, denim",
        image: "/pamfa1.jpg",
      },
      {
        id: 3,
        name: "Author Thomas J Hooker Sr.",
        url: "https://www.amazon.com/-/es/Thomas-J-Hooker/dp/1938814886/",
        description:
          "A seasoned IT executive with over 25 years of experience, an entrepreneur, and an author.",
        categories: "General, Retail, Author, Books, Services, Education",
        image: "/risingabovetheeveryday.jpg",
      },
      {
        id: 4,
        name: "COCO and BREEZY",
        url: "https://cocoandbreezy.com/",
        description: "Coco and Breezy designer optical glasses and sunglasses.",
        categories: "General, Retail, fashion, eyewear",
        image: "/Cocoand breezy.jpg",
      },
      {
        id: 5,
        name: "Guardians Of The Forgotten Realm",
        url: "https://www.facebook.com/profile.php?id=61571704947330/",
        description:
          "Step into an epic world of mystery and magic with Guardians of the Forgotten Realm.",
        categories: "Action-Adventure, Entertainmnet, Film",
        image: "/Guardians.jpg",
      },
    ];
    setAffiliateOffers(data);
  }, []);

  const steps = [
    {
      step: 1,
      title: "Sign Up",
      description: "Join as a content creator or influencer.",
      label: "Sign Up Now",
      path: "/affiliate/signup",
    },
    {
      step: 2,
      title: "Recommend",
      description: "Share curated affiliate links.",
      label: "Get Your Links",
      path: "/affiliate/recommendation",
    },
    {
      step: 3,
      title: "Earn",
      description: "Earn competitive commissions.",
      label: "Start Earning",
      path: "/affiliate/earn",
    },
  ];

  return (
    <>
      <Head>
        <title>
          Affiliate &amp; Partnership Program | Black Wealth Exchange
        </title>
      </Head>
      <div className="min-h-screen bg-black text-white">
        {/* Intro Section */}
        <section className="container mx-auto px-4 py-10 sm:py-12 md:py-16 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-gold mb-4 leading-tight max-w-2xl mx-auto">
            Empower Black Entrepreneurship
          </h1>
          <p className="text-base sm:text-lg md:text-2xl text-gray-300 mb-6 max-w-xl mx-auto">
            Join our Affiliate &amp; Partnership Program to access exclusive opportunities and grow your business.
          </p>
          
          {/* Affiliate Status Button */}
          <div className="my-4">
            {affiliateStatus === "loading" ? (
              <p className="text-gray-400 text-sm mt-2">Checking your affiliate status...</p>
            ) : affiliateStatus === "active" ? (
              <Link
                href="/affiliate/recommendation"
                className="inline-block px-6 py-3 bg-gold text-black font-bold rounded hover:bg-yellow-500 transition-colors duration-200 mb-2"
              >
                Go to Your Affiliate Dashboard
              </Link>
            ) : (
              <Link
                href="/affiliate/signup"
                className="inline-block px-6 py-3 bg-gold text-black font-bold rounded hover:bg-yellow-500 transition-colors duration-200 mb-2"
              >
                Become an Affiliate
              </Link>
            )}
          </div>

          <div className="mt-3">
            <a
              href="mailto:partners@blackwealthexchange.com"
              className="inline-block px-4 py-2.5 sm:px-6 sm:py-3 border border-gold text-gold rounded hover:bg-gold hover:text-black transition-colors duration-200 text-sm sm:text-base"
            >
              Business Partnership Inquiry
            </a>
          </div>
        </section>

        {/* How It Works */}
        <section className="container mx-auto px-4 py-7 sm:py-10 md:py-12">
          <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-gold text-center mb-4 leading-tight max-w-xl mx-auto">
            How It Works
          </h2>
          <p className="text-center text-base sm:text-lg md:text-xl text-gray-300 mb-8 max-w-lg mx-auto">
            Monetize your traffic and collaborate with us in three simple steps.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map(({ step, title, description, label, path }) => (
            <div
              key={step}
              className="bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300 text-center"
            >
              <div className="mb-4">
                <span className="text-5xl text-gold">{step}</span>
              </div>
              <h3 className="text-2xl font-semibold text-gold mb-2">
                {title}
              </h3>
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

        {/* Affiliate Offers */}
        <section className="container mx-auto px-4 py-12">
          <h2 className="text-4xl font-bold text-gold text-center mb-6">
            Curated Affiliate Offers
          </h2>
          <p className="text-center text-xl text-gray-300 mb-12">
            Explore our hand-picked resources and products.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {affiliateOffers.map((offer) => (
              <div
                key={offer.id}
                className="bg-gray-800 p-4 rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300 flex flex-col"
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

export default AffiliatePartnershipPage;

