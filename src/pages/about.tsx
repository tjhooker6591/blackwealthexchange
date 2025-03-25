// /pages/about.tsx

"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function About() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero / Intro Section */}
      <section className="relative w-full h-64 flex items-center justify-center overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-800 to-indigo-700" />

        {/* Background Hero Image (semi-transparent) */}
        <Image
          src="/hero.jpg" // Make sure you have /public/hero.jpg or update path
          alt="Hero background"
          fill
          className="object-cover opacity-30"
        />

        {/* Hero Text */}
        <h1 className="relative text-4xl md:text-5xl font-extrabold text-white z-10">
          Our Mission &amp; Vision
        </h1>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-gold mb-6">
          Empowering the Black Community—Financially &amp; Culturally
        </h2>
        <p className="text-lg text-gray-300 mb-8">
          We believe in harnessing our collective spending power to build
          sustainable wealth and strengthen our communities. Our platform brings
          together a variety of resources—from a Black-owned business directory
          and financial literacy tools to student grants and entertainment
          news—all under one roof. By uniting these elements, we aim to
          celebrate Black culture, uplift entrepreneurs, and nurture future
          generations of leaders.
        </p>

        {/* Highlight Each Section Briefly */}
        <div className="space-y-8">
          <div>
            <h3 className="text-2xl text-gold font-semibold mb-2">
              Business Directory
            </h3>
            <p className="text-gray-400 mb-2">
              Discover and support Black-owned businesses in your area and
              beyond. Each listing provides essential details, reviews, and
              location info to help you shop local and empower entrepreneurs.
            </p>
            <Link href="/business-directory">
              <button className="px-4 py-2 bg-gold text-black rounded hover:bg-yellow-500 transition">
                Explore Businesses
              </button>
            </Link>
          </div>

          <div>
            <h3 className="text-2xl text-gold font-semibold mb-2">
              Entertainment &amp; News
            </h3>
            <p className="text-gray-400 mb-2">
              Stay informed about the latest in Black entertainment, culture,
              and current events. We spotlight stories that reflect our
              community&apos;s diverse experiences and talents.
            </p>
            <Link href="/black-entertainment-news">
              <button className="px-4 py-2 bg-gold text-black rounded hover:bg-yellow-500 transition">
                Read Entertainment News
              </button>
            </Link>
          </div>

          <div>
            <h3 className="text-2xl text-gold font-semibold mb-2">
              Financial Literacy &amp; 101 Training
            </h3>
            <p className="text-gray-400 mb-2">
              Learn how to manage money, invest wisely, and leverage credit. We
              offer tools and guides to help you build generational wealth and
              close the racial wealth gap—one family at a time.
            </p>
            <Link href="/financial-literacy">
              <button className="px-4 py-2 bg-gold text-black rounded hover:bg-yellow-500 transition">
                Start Learning
              </button>
            </Link>
          </div>

          <div>
            <h3 className="text-2xl text-gold font-semibold mb-2">
              Student Resources
            </h3>
            <p className="text-gray-400 mb-2">
              Access grants, loans, internships, and mentorship programs
              tailored for Black students. We believe in fostering educational
              success and career readiness for the next generation of leaders.
            </p>
            <Link href="/black-student-opportunities">
              <button className="px-4 py-2 bg-gold text-black rounded hover:bg-yellow-500 transition">
                View Opportunities
              </button>
            </Link>
          </div>

          <div>
            <h3 className="text-2xl text-gold font-semibold mb-2">
              Housing &amp; Lending
            </h3>
            <p className="text-gray-400 mb-2">
              Find resources for home ownership, mortgage guidance, and fair
              lending options. Our aim is to help more families build equity
              through property investment and stable housing.
            </p>
            <Link href="/housing-lending">
              <button className="px-4 py-2 bg-gold text-black rounded hover:bg-yellow-500 transition">
                Learn More
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-gold mb-4">
          Ready to Get Involved?
        </h2>
        <p className="text-gray-400 mb-6">
          Whether you&apos;re a consumer looking to shop, a student seeking
          scholarships, or an entrepreneur ready to grow your business, we have
          the tools and resources you need to succeed.
        </p>
        <Link href="/signup">
          <button className="px-6 py-3 bg-black text-gold border border-gold font-semibold rounded hover:bg-gray-800 transition">
            Join the Community
          </button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-black text-center py-6">
        <p className="text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Black Wealth Exchange. All rights
          reserved.
        </p>
      </footer>
    </div>
  );
}
