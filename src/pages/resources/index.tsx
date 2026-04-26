// pages/resources/index.tsx
import Link from "next/link";
import React from "react";

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
  return (
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
                  Read Article →
                </Link>
              ) : (
                <span className="font-medium text-gray-500">
                  Article coming soon
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
