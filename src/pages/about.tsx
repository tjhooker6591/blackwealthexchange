"use client";

import React from "react";
import Link from "next/link";

export default function About() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Mission Section */}
      <section className="container mx-auto px-4 py-16 text-left">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gold mb-8">
          Our Mission & Constitutional Standpoint
        </h1>
        <div className="space-y-6 text-lg text-gray-300 max-w-4xl">
          <p>
            Black Wealth Exchange was born from necessity—a strategic,
            unapologetic response to generations of systemic exclusion, economic
            suppression, and the intentional dismantling of Black prosperity in
            America. Our mission is not one of division but of restoration. We
            seek to rebuild what was broken, reclaim what was withheld, and
            reimagine what’s possible for Black communities through economic
            empowerment, entrepreneurship, and ownership.
          </p>
          <p>
            We understand the weight of our words. In a country where narratives
            are often shaped to maintain the status quo, we know how quickly
            purpose can be misinterpreted. Let us be clear:
          </p>
          <p className="italic text-gold">
            We are not anti-anyone.
            <br />
            We are pro-ourselves.
          </p>
          <p>
            Just as other cultural groups have established networks to uplift
            and support their communities, we exercise our{" "}
            <strong>First Amendment rights</strong> and all protections afforded
            under federal and state law to do the same. The Constitution grants
            us the freedom to assemble, to speak, to build, and to serve our
            people. We use these rights, not in opposition, but in assertion.
          </p>
          <p>
            To promote Black-owned businesses, talent, innovation, and capital
            circulation is not racism—it is <strong>reclamation</strong>.
          </p>
          <p>
            For centuries, wealth and opportunity were extracted from Black
            hands through redlining, labor theft, exclusionary policies, and
            state-sanctioned discrimination. Today, those impacts are measurable
            and ongoing. Our mission exists to{" "}
            <strong>interrupt that legacy</strong> and offer something better.
          </p>
          <p className="font-bold text-gold">
            We are strategic.
            <br />
            We are lawful.
            <br />
            We are necessary.
          </p>
          <p>
            We welcome allies who understand that equity is not a threat to
            fairness—it is its fulfillment. We are not asking for permission to
            rise; we are exercising the rights that are already ours.
          </p>
          <p className="text-gold font-semibold">
            This is more than a platform.
            <br />
            This is a movement to reclaim economic power—on our terms, with our
            voice, and in full alignment with the laws that protect our right to
            exist and thrive.
          </p>
        </div>
      </section>

      {/* Platform Features Section */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-gold mb-6">What We Offer</h2>
        <p className="text-lg text-gray-300 mb-8">
          Our platform brings together essential tools to uplift our
          communities—from Black-owned business directories and financial
          literacy tools to student grants and news designed to inform and
          empower.
        </p>

        <div className="space-y-12">
          <FeatureSection
            title="Business Directory"
            description="Discover and support Black-owned businesses in your area and beyond. Each listing provides essential details, reviews, and location info to help you shop local and empower entrepreneurs."
            href="/business-directory"
            buttonLabel="Explore Businesses"
          />

          <FeatureSection
            title="Entertainment & News"
            description="Stay informed about the latest in Black entertainment, culture, and current events. We spotlight stories that reflect our community’s diverse experiences and talents."
            href="/black-entertainment-news" // <- If you’re using "/news" instead, update here
            buttonLabel="Read Entertainment News"
          />

          <FeatureSection
            title="Financial Literacy & 101 Training"
            description="Learn how to manage money, invest wisely, and build generational wealth. We offer tools and guides to help you close the racial wealth gap—one family at a time."
            href="/financial-literacy"
            buttonLabel="Start Learning"
          />

          <FeatureSection
            title="Student Resources"
            description="Access grants, loans, internships, and mentorship programs tailored for Black students. We believe in fostering educational success and career readiness for the next generation of leaders."
            href="/black-student-opportunities/scholarships"
            buttonLabel="View Opportunities"
          />

          <FeatureSection
            title="Housing & Lending"
            description="Find resources for home ownership, mortgage guidance, and fair lending options. Our aim is to help more families build equity through property investment and stable housing."
            href="/real-estate-investment" // <- If you're using "/housing-lending", update this
            buttonLabel="Learn More"
          />
        </div>
      </section>

      {/* Call to Action */}
      <section className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-gold mb-4">
          Ready to Get Involved?
        </h2>
        <p className="text-gray-400 mb-6">
          Whether you’re a consumer looking to shop, a student seeking
          scholarships, or an entrepreneur ready to grow your business—we have
          the tools and community to help you thrive.
        </p>
        <Link href="/signup">
          <button className="px-6 py-3 bg-black text-gold border border-gold font-semibold rounded hover:bg-gray-800 transition">
            Join the Community
          </button>
        </Link>
      </section>

      {/* Footer */}
      {/* Footer */}
      <footer className="bg-black text-center py-6">
        <div className="text-gray-500 text-sm space-y-2">
          <p>
            &copy; {new Date().getFullYear()} Black Wealth Exchange. All rights
            reserved.
          </p>
          <div className="flex justify-center space-x-4 text-xs text-gray-400 mt-2">
            <Link
              href="/terms-of-service"
              className="hover:text-gold transition"
            >
              Terms of Service
            </Link>
            <Link href="/privacy-policy" className="hover:text-gold transition">
              Privacy Policy
            </Link>
            <Link
              href="/legal/community-conduct"
              className="hover:text-gold transition"
            >
              Code of Conduct
            </Link>
            <Link
              href="/legal/advertising-guidelines"
              className="hover:text-gold transition"
            >
              Advertising Guidelines
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

const FeatureSection = ({
  title,
  description,
  href,
  buttonLabel,
}: {
  title: string;
  description: string;
  href: string;
  buttonLabel: string;
}) => (
  <div>
    <h3 className="text-2xl text-gold font-semibold mb-2">{title}</h3>
    <p className="text-gray-400 mb-4">{description}</p>
    <Link href={href}>
      <button className="px-4 py-2 bg-gold text-black rounded hover:bg-yellow-500 transition">
        {buttonLabel}
      </button>
    </Link>
  </div>
);
