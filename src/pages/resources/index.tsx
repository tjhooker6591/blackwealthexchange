// pages/resources/index.tsx
import Link from "next/link";
import Head from "next/head";
import React from "react";
import { canonicalUrl, truncateMeta } from "@/lib/seo";

const articles = [
  {
    title: "Writing Inclusive Job Descriptions",
    summary:
      "Learn how to craft job posts that attract diverse candidates and avoid unconscious bias.",
    slug: "inclusive-job-descriptions",
    available: true,
  },
  {
    title: "Hiring Black Talent: Best Practices",
    summary:
      "Strategies and tools to effectively engage, attract, and support Black professionals.",
    slug: "hiring-black-talent",
    available: false,
  },
  {
    title: "How to Build an Internship Pipeline",
    summary:
      "Develop a structured program to mentor and hire students from underrepresented communities.",
    slug: "internship-pipeline-guide",
    available: false,
  },
];

export default function ResourcesIndex() {
  const title = "Employer Resources | Black Wealth Exchange";
  const description = truncateMeta(
    "Practical hiring, onboarding, and retention guidance to help employers build equitable teams and support Black talent.",
  );
  const canonical = canonicalUrl("/resources");
  const collectionSchema = {
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
        {JSON.stringify(collectionSchema)}
      </script>
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold text-gold mb-6">
            Employer Resources
          </h1>
          <p className="text-gray-300 mb-8">
            Practical guidance for hiring, onboarding, and retaining diverse
            talent with clear implementation steps.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {articles.map((article) => (
              <div
                key={article.slug}
                className="bg-gray-900/90 p-6 rounded-xl border border-gray-700/80 shadow-sm"
              >
                <h2 className="text-xl font-semibold text-gold mb-2">
                  {article.title}
                </h2>
                <p className="text-gray-400 mb-4">{article.summary}</p>
                {article.available ? (
                  <Link
                    href={`/resources/${article.slug}`}
                    className="font-medium text-gold hover:underline"
                  >
                    Read Article (Free) →
                  </Link>
                ) : (
                  <span className="font-medium text-gray-500">
                    Article in editorial queue
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
