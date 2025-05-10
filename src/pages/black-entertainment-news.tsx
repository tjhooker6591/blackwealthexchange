// src/pages/black-entertainment-news.tsx
import React from "react";
import Link from "next/link";
import Image from "next/legacy/image";
import { motion } from "framer-motion";

// Spotlight data type
interface Spotlight {
  id: number;
  imageSrc: string;
  name: string;
  story: string;
  link: string;
}

// Trend data type
interface Trend {
  id: number;
  title: string;
  summary: string;
  sourceUrl: string;
}

// Sample spotlight entries
const spotlightData: Spotlight[] = [
  {
    id: 1,
    imageSrc: "/images/spotlight1.jpg",
    name: "Coffee Cultures Co.",
    story:
      "From seed to cup, this Black-owned coffee brand is redefining sustainable sourcing.",
    link: "/business/coffee-cultures",
  },
  {
    id: 2,
    imageSrc: "/images/spotlight2.jpg",
    name: "We are Fashion Innovator",
    story:
      "Innovators behind inclusive fashion that empowers and are setting trends in fashion and our communities.",
    link: "/business/fashion",
  },
];

// Sample trend entries
const trendsData: Trend[] = [
  {
    id: 1,
    title: "VC Funding for Black Entrepreneurs Hits Record High",
    summary:
      "Latest Q1 data shows Black-led startups secured $500M in venture funding.",
    sourceUrl: "https://example.com/article1",
  },
  {
    id: 2,
    title: "Community Banks Expand Support Programs",
    summary:
      "Black-owned banks launch new small-business grants across four states.",
    sourceUrl: "https://example.com/article2",
  },
];

export default function BlackEntertainmentNews() {
  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <div className="container mx-auto p-6 space-y-16">
        {/* Business Spotlight */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center mb-6">
            <h2 className="text-3xl font-extrabold text-gold mr-4">
              🔥 Business Spotlight
            </h2>
            <div className="flex-1 h-1 bg-gradient-to-r from-gold to-yellow-400 rounded" />
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {spotlightData.map((s) => (
              <motion.div
                key={s.id}
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 10px 20px rgba(0,0,0,0.5)",
                }}
                className="relative group overflow-hidden rounded-2xl"
              >
                <div className="absolute inset-0 transform group-hover:scale-110 transition duration-500">
                  <Image
                    src={s.imageSrc}
                    alt={s.name}
                    layout="fill"
                    objectFit="cover"
                    className="opacity-80"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-10 group-hover:bg-opacity-0 transition duration-500" />
                </div>
                <div className="relative p-6 flex flex-col justify-end h-64">
                  <span className="bg-gold text-black px-3 py-1 rounded-full text-sm font-semibold mb-2">
                    Spotlight
                  </span>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {s.name}
                  </h3>
                  <p className="text-gray-100 mb-4">{s.story}</p>
                  <Link
                    href={s.link}
                    className="self-start px-4 py-2 bg-gradient-to-r from-gold to-yellow-400 rounded-lg font-semibold text-black hover:from-yellow-300 hover:to-yellow-500 transition"
                  >
                    Learn More →
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Industry News & Trends Roundup */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center mb-6">
            <h2 className="text-3xl font-extrabold text-gold mr-4">
              📈 Industry News & Trends
            </h2>
            <div className="flex-1 h-1 bg-gradient-to-r from-gold to-yellow-400 rounded" />
          </div>
          <div className="space-y-6">
            {trendsData.map((t) => (
              <motion.div
                key={t.id}
                whileHover={{ x: 10 }}
                className="flex items-start bg-gradient-to-r from-gray-800 to-gray-700 p-6 rounded-xl shadow-lg"
              >
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {t.title}
                  </h3>
                  <p className="text-gray-300 mb-3">{t.summary}</p>
                  <a
                    href={t.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block font-semibold text-gold hover:underline"
                  >
                    Read Full Article →
                  </a>
                </div>
                <div className="ml-6 flex-shrink-0 text-gold text-4xl">
                  ➔
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Fallen & Everyday Heroes */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="container mx-auto p-6"
        >
          <div className="flex items-center mb-6">
            <h2 className="text-3xl font-extrabold text-gold mr-4">
              🌟 Honoring Our Fallen & Everyday Heroes
            </h2>
            <div className="flex-1 h-1 bg-gradient-to-r from-gold to-yellow-400 rounded" />
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                id: 1,
                imageSrc: "/images/hero1.jpg",
                name: "Angie Stone",
                description:
                  "Renowned soul singer and songwriter whose powerful vocals and advocacy left an enduring legacy in music and the community.",
              },
              {
                id: 2,
                imageSrc: "/images/hero2.jpg",
                name: "Everyday Neighbor: Beatrice Bethel Johnson",
                description:
                  "First Black librarian in the School District of Philadelphia, retired business owner, and community advocate, has died at 96.",
              },
              {
                id: 3,
                imageSrc: "/images/hero3.jpg",
                name: "Marcus Jones",
                description:
                  "Local entrepreneur whose small business supported dozens of families.",
              },
            ].map((h) => (
              <motion.div
                key={h.id}
                whileHover={{ scale: 1.03 }}
                className="relative overflow-hidden rounded-2xl shadow-lg"
              >
                <div className="relative w-full h-64">
                  <Image
                    src={h.imageSrc}
                    alt={h.name}
                    layout="fill"
                    objectFit="cover"
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
  );
}
