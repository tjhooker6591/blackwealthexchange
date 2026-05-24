"use client";

import React from "react";
import Link from "next/link";
import Head from "next/head";
import { canonicalUrl, truncateMeta } from "@/lib/seo";

export default function GeneralArticlesPage() {
  const title = "Articles & Resources | Black Wealth Exchange";
  const description = truncateMeta(
    "Explore curated resources on financial literacy, entrepreneurship, inclusive hiring, and building generational wealth.",
  );
  const canonical = canonicalUrl("/resources/articles");
  const articleListSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description,
    url: canonical,
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={canonicalUrl("/images/hero1.jpg")} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta
          name="twitter:image"
          content={canonicalUrl("/images/hero1.jpg")}
        />
      </Head>
      <script type="application/ld+json">
        {JSON.stringify(articleListSchema)}
      </script>
      <div className="min-h-screen bg-black text-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold text-gold mb-6">
            Empowerment Articles & Resources
          </h1>
          <p className="text-gray-300 text-lg mb-10">
            Dive into curated articles designed to elevate your financial
            knowledge, community awareness, and entrepreneurial mindset. Whether
            you are building a business, managing your personal finances, or
            looking to grow generational wealth — these resources are here for
            you.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <ArticleCard
              title="Financial Literacy 101"
              href="/financial-literacy"
              description="Understand budgeting, saving, credit, and the foundation of building wealth."
            />
            <ArticleCard
              title="How to Start a Black-Owned Business"
              href="/add-business"
              description="Step-by-step guidance to get your vision off the ground — from LLCs to branding."
            />
            <ArticleCard
              title="Reclaiming Economic Power"
              href="/1.8trillionimpact"
              description="Explore the impact of Black spending power and how to redirect it intentionally."
            />
            <ArticleCard
              title="Building Generational Wealth"
              href="/courses/generational-wealth"
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
    </>
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
