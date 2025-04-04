"use client";

import Link from "next/link";
import React from "react";

export default function EmployerResourcesIndex() {
  return (
    <div className="min-h-screen bg-black text-white py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-gold mb-6">
          Employer Resource Center
        </h1>
        <p className="text-gray-300 mb-8 text-lg">
          Welcome to the Black Wealth Exchange Employer Resource Center. Our
          goal is to equip you with the tools, insights, and strategies to build
          inclusive, impactful teams while supporting Black talent and
          communities.
        </p>

        <section className="space-y-6">
          <ResourceCard
            title="Crafting Inclusive Job Descriptions"
            href="/resources/inclusive-job-descriptions"
            description="Learn how to write job descriptions that attract diverse candidates and reflect equitable values."
          />
          <ResourceCard
            title="Hiring Best Practices for Equity"
            href="/employer/resources/articles"
            description="Explore articles on building fair hiring pipelines, structured interviews, and inclusive onboarding."
          />
          <ResourceCard
            title="Promote Opportunities Effectively"
            href="/advertise-with-us"
            description="Get more visibility by sponsoring your listings or featuring your company across our network."
          />
        </section>
      </div>
    </div>
  );
}

function ResourceCard({
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
      <div className="bg-gray-800 border border-gold rounded-lg p-6 hover:bg-gray-700 transition cursor-pointer">
        <h2 className="text-2xl font-semibold text-gold mb-2">{title}</h2>
        <p className="text-gray-400">{description}</p>
      </div>
    </Link>
  );
}
