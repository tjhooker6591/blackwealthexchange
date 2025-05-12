// src/pages/black-entertainment-news.tsx

import React from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { industryNewsData } from "../lib/IndustryNewsEntry"; // ← import your generic news data

/* ────────────  Types ──────────── */
interface Spotlight {
  id: number;
  imageSrc: string;
  name: string;
  story: string;
  link: string;
}

interface Hero {
  id: number;
  imageSrc: string;
  name: string;
  description: string;
}

/* ────────────  Data ──────────── */
const spotlightData: Spotlight[] = [
  {
    id: 1,
    imageSrc: "/images/spotlight1.jpg",
    name: "Coffee Culture Co.",
    story:
      "From seed to cup, this Black-owned coffee brand is redefining sustainable sourcing.",
    link: "/business/coffee-cultures",
  },
  {
    id: 2,
    imageSrc: "/images/spotlight2.jpg",
    name: "Fashion Innovator – Black Fashion Designers",
    story:
      "A collective powering inclusive fashion that uplifts communities and sets global trends.",
    link: "/business/fashion",
  },
];

const heroesData: Hero[] = [
  {
    id: 1,
    imageSrc: "/images/hero1.jpg",
    name: "Angie Stone",
    description:
      "Renowned soul singer and songwriter whose powerful vocals and advocacy left an enduring legacy.",
  },
  {
    id: 2,
    imageSrc: "/images/hero2.jpg",
    name: "Beatrice Bethel Johnson",
    description:
      "Philadelphia’s first Black school-district librarian, entrepreneur, and lifelong community advocate.",
  },
  {
    id: 3,
    imageSrc: "/images/hero3.jpg",
    name: "Marcus Jones",
    description:
      "Local entrepreneur whose small business has supported dozens of families for over two decades.",
  },
];

/* ────────────  Helpers ──────────── */
const imageFit = { objectFit: "cover" as const };

/* ────────────  Component ──────────── */
export default function BlackEntertainmentNews() {
  return (
    <>
      <Head>
        <title>Black Entertainment News | Black Wealth Exchange</title>
        <meta
          name="description"
          content="Spotlighting Black-owned businesses, industry trends, and community heroes."
        />
      </Head>

      <div className="bg-gray-900 text-white min-h-screen">
        <div className="container mx-auto p-6 space-y-16">
          {/* ───────── Business Spotlight ───────── */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <SectionHeader title="🔥 Business Spotlight" />

            <div className="grid md:grid-cols-2 gap-8">
              {spotlightData.map((s) => (
                <motion.div
                  key={s.id}
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 10px 20px rgba(0,0,0,0.5)",
                  }}
                  transition={{ type: "spring", stiffness: 70 }}
                  className="relative group overflow-hidden rounded-2xl"
                >
                  <div className="absolute inset-0 transform group-hover:scale-110 transition duration-500">
                    <Image
                      src={s.imageSrc}
                      alt={s.name}
                      fill
                      style={imageFit}
                      className="opacity-80"
                      priority
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-10 group-hover:bg-opacity-0 transition duration-500" />
                  </div>

                  <div className="relative p-6 flex flex-col justify-end h-64">
                    <span className="bg-gold text-black px-3 py-1 rounded-full text-sm font-semibold mb-2">
                      Spotlight
                    </span>
                    <h3 className="text-2xl font-bold mb-2">{s.name}</h3>
                    <p className="text-gray-100 mb-4">{s.story}</p>

                    <Link
                      href={s.link}
                      aria-label={`Read more about ${s.name}`}
                      className="self-start px-4 py-2 bg-gradient-to-r from-gold to-yellow-400 rounded-lg font-semibold text-black hover:from-yellow-300 hover:to-yellow-500 transition"
                    >
                      Learn More →
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* ───────── Industry News & Trends ───────── */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <SectionHeader title="📈 Industry News & Trends" />

            <div className="space-y-6">
              {industryNewsData.map((t) => (
                <motion.div
                  key={t.id}
                  whileHover={{ x: 10 }}
                  transition={{ type: "spring", stiffness: 70 }}
                  className="flex items-start bg-gradient-to-r from-gray-800 to-gray-700 p-6 rounded-xl shadow-lg"
                >
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{t.title}</h3>
                    <p className="text-gray-300 mb-3">{t.summary}</p>

                    <Link
                      href={`/industry-news/${t.slug}`}
                      aria-label={`Read full article: ${t.title}`}
                      className="inline-block font-semibold text-gold hover:underline"
                    >
                      Read Full Article →
                    </Link>
                  </div>
                  <div className="ml-6 flex-shrink-0 text-gold text-4xl">➔</div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* ───────── Fallen & Everyday Heroes ───────── */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <SectionHeader title="🌟 Honoring Our Fallen & Everyday Heroes" />

            <div className="grid md:grid-cols-3 gap-8">
              {heroesData.map((h) => (
                <motion.div
                  key={h.id}
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 70 }}
                  className="relative overflow-hidden rounded-2xl shadow-lg"
                >
                  <div className="relative w-full h-64">
                    <Image
                      src={h.imageSrc}
                      alt={h.name}
                      fill
                      style={imageFit}
                      className="opacity-90"
                    />
                  </div>

                  <div className="p-4 bg-gray-800">
                    <h3 className="text-xl font-semibold text-gold mb-2">
                      {h.name}
                    </h3>
                    <p className="text-gray-300">{h.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        </div>
      </div>
    </>
  );
}

/* ────────────  Re-usable sub-component ──────────── */
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center mb-6">
      <h2 className="text-3xl font-extrabold text-gold mr-4">{title}</h2>
      <div className="flex-1 h-1 bg-gradient-to-r from-gold to-yellow-400 rounded" />
    </div>
  );
}
