'use client';

import React from 'react';
import Link from 'next/link';

export default function GeneralArticlesPage() {
  return (
    <div className="min-h-screen bg-black text-white py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-gold mb-6">Empowerment Articles & Resources</h1>
        <p className="text-gray-300 text-lg mb-10">
          Dive into curated articles designed to elevate your financial knowledge, community awareness, and
          entrepreneurial mindset. Whether you are building a business, managing your personal finances, or looking
          to grow generational wealth — these resources are here for you.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <ArticleCard
            title="Financial Literacy 101"
            href="/courses/personal-finance"
            description="Understand budgeting, saving, credit, and the foundation of building wealth."
          />
          <ArticleCard
            title="How to Start a Black-Owned Business"
            href="/resources/starting-a-business"
            description="Step-by-step guidance to get your vision off the ground — from LLCs to branding."
          />
          <ArticleCard
            title="Reclaiming Economic Power"
            href="/1.8trillionimpact"
            description="Explore the impact of Black spending power and how to redirect it intentionally."
          />
          <ArticleCard
            title="Building Generational Wealth"
            href="/courses/building-wealth"
            description="Explore long-term strategies like investing, insurance, and real estate."
          />
          <ArticleCard
            title="Inclusive Hiring Practices"
            href="/resources/inclusive-job-descriptions"
            description="Attract top talent by building fair, inclusive job descriptions and practices."
          />
          <ArticleCard
            title="Circulating the Black Dollar"
            href="/business-directory"
            description="Find and support Black-owned businesses to grow local and national wealth."
          />
        </div>
      </div>
    </div>
  );
}

function ArticleCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <div className="bg-gray-800 border border-gold p-6 rounded-lg hover:bg-gray-700 transition cursor-pointer">
        <h2 className="text-2xl font-semibold text-gold mb-2">{title}</h2>
        <p className="text-gray-400">{description}</p>
      </div>
    </Link>
  );
}
