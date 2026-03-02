// src/pages/affiliate/index.tsx
"use client";

import type { NextPage } from "next";
import React, { useEffect, useMemo, useState } from "react";
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

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
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
        if (linksRes.ok) setAffiliateStatus("active");
        else setAffiliateStatus("inactive");
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

  const steps = useMemo(
    () => [
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
    ],
    [],
  );

  const statusCTA =
    affiliateStatus === "active"
      ? {
          href: "/affiliate/recommendation",
          label: "Go to Affiliate Dashboard",
        }
      : { href: "/affiliate/signup", label: "Become an Affiliate" };

  return (
    <>
      <Head>
        <title>
          Affiliate &amp; Partnership Program | Black Wealth Exchange
        </title>
        <meta
          name="description"
          content="Join the Black Wealth Exchange Affiliate & Partnership Program to promote Black-owned brands and earn commissions."
        />
      </Head>

      <div className="min-h-screen bg-black text-white">
        {/* Soft gold glow like index */}
        <div className="pointer-events-none fixed inset-0 -z-10 opacity-60">
          <div className="absolute left-1/2 top-24 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#D4AF37]/10 blur-3xl" />
          <div className="absolute left-20 bottom-20 h-[420px] w-[420px] rounded-full bg-[#D4AF37]/6 blur-3xl" />
        </div>

        <main className="mx-auto w-full max-w-6xl px-4 py-10">
          {/* Header / Intro */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-10 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-gold">
                  Affiliate &amp; Partnership Program
                </h1>
                <p className="mt-3 text-sm sm:text-base md:text-lg text-white/70 max-w-3xl">
                  Promote Black-owned brands and curated offers, earn
                  commissions, and help grow the Black Wealth Exchange
                  ecosystem.
                </p>

                {/* Status */}
                <div className="mt-4">
                  {affiliateStatus === "loading" ? (
                    <p className="text-white/60 text-sm">
                      Checking your affiliate status…
                    </p>
                  ) : (
                    <p className="text-white/60 text-sm">
                      Status:{" "}
                      <span className="text-white font-semibold">
                        {affiliateStatus === "active"
                          ? "Active Affiliate"
                          : "Not Enrolled"}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href={statusCTA.href}
                  className="inline-flex items-center justify-center rounded-xl bg-gold px-5 py-3 font-bold text-black hover:bg-yellow-400 transition"
                >
                  {statusCTA.label}
                </Link>

                <a
                  href="mailto:partners@blackwealthexchange.com"
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white hover:bg-white/10 transition"
                >
                  Business Partnership Inquiry
                </a>
              </div>
            </div>

            {/* Trust strip (substance) */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <p className="text-sm font-semibold text-white">
                  Curated Offers
                </p>
                <p className="mt-1 text-sm text-white/70">
                  Promote hand-picked brands and resources aligned with the
                  mission.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <p className="text-sm font-semibold text-white">
                  Trackable Links
                </p>
                <p className="mt-1 text-sm text-white/70">
                  Use your affiliate links to track engagement and earnings.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <p className="text-sm font-semibold text-white">
                  Earn Commissions
                </p>
                <p className="mt-1 text-sm text-white/70">
                  Get rewarded for driving qualified traffic and conversions.
                </p>
              </div>
            </div>
          </div>

          {/* How it works */}
          <section className="mt-10">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-white">
                  How It Works
                </h2>
                <p className="mt-1 text-sm text-white/70">
                  Monetize your traffic in three simple steps.
                </p>
              </div>
              <Link
                href="/affiliate/signup"
                className="hidden sm:inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
              >
                Learn more →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {steps.map(({ step, title, description, label, path }) => (
                <div
                  key={step}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] hover:border-white/20 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white/70">
                      Step {step}
                    </span>
                    <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs font-bold text-gold">
                      {title}
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-white">{title}</h3>
                  <p className="mt-2 text-sm text-white/70">{description}</p>

                  <div className="mt-5">
                    <Link
                      href={path}
                      className="inline-flex w-full items-center justify-center rounded-xl bg-gold px-4 py-2 text-sm font-bold text-black hover:bg-yellow-400 transition"
                    >
                      {label}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Affiliate offers */}
          <section className="mt-10">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-white">
                  Curated Affiliate Offers
                </h2>
                <p className="mt-1 text-sm text-white/70">
                  Explore hand-picked resources and products you can confidently
                  share.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {affiliateOffers.map((offer) => (
                <div
                  key={offer.id}
                  className={cx(
                    "rounded-2xl border border-white/10 bg-white/5 overflow-hidden",
                    "shadow-[0_0_0_1px_rgba(255,255,255,0.03)] hover:border-white/20 transition",
                    "flex flex-col",
                  )}
                >
                  <div className="relative w-full h-28">
                    <Image
                      src={offer.image}
                      alt={offer.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 20vw"
                      priority={offer.id <= 2}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                  </div>

                  <div className="p-4 flex flex-col gap-2 flex-1">
                    <h3 className="text-base font-bold text-white leading-snug">
                      {offer.name}
                    </h3>

                    <div className="text-[11px] text-white/60">
                      {offer.categories}
                    </div>

                    <p className="text-sm text-white/70 line-clamp-3">
                      {offer.description}
                    </p>

                    <div className="mt-auto pt-2">
                      <a
                        href={offer.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full items-center justify-center rounded-xl bg-gold px-3 py-2 text-sm font-bold text-black hover:bg-yellow-400 transition"
                      >
                        Visit Site
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8 text-center">
              <h3 className="text-xl md:text-2xl font-bold text-gold">
                Ready to earn with purpose?
              </h3>
              <p className="mt-2 text-sm md:text-base text-white/70 max-w-2xl mx-auto">
                Join the affiliate program, get your links, and start sharing
                curated offers aligned with Black economic empowerment.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
                <Link
                  href="/affiliate/signup"
                  className="inline-flex items-center justify-center rounded-xl bg-gold px-6 py-3 font-bold text-black hover:bg-yellow-400 transition"
                >
                  Become an Affiliate
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white hover:bg-white/10 transition"
                >
                  Back to Search
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
};

export default AffiliatePartnershipPage;
