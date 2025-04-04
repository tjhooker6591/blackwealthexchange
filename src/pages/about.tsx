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
            Black Wealth Exchange was not created in response—it was created in
            resolve. A deliberate, strategic stand against the centuries-long
            denial of Black economic self-determination. We are not here to
            reclaim what was never rightfully given—we are here to build what we
            were systemically denied the right to establish. This is not a
            request. This is a declaration.
          </p>
          <p>
            Our mission is rooted in truth and unapologetic in vision: to ignite
            a new era of Black prosperity through ownership, enterprise,
            innovation, and collective power. We are not rebuilding ruins—we are
            laying foundations never permitted to exist. And we will not be
            deterred.
          </p>
          <p>
            <strong className="text-gold">
              We understand the weight of our words.
            </strong>{" "}
            In a nation where language has been used to erase, distort, and
            suppress, we choose our words with precision and purpose. We speak
            not in anger, but in clarity. Not in division, but in direction. Our
            voice is not a whisper—it is a force.
          </p>
          <p>
            This mission is not only about economic revival—it is about
            re-education. For too long, systemic programming, fear-based
            control, and media distortion have been used to fracture Black
            unity—dividing us by class, by language, by border, and by design.
            We reject those tactics. We reject the intimidation, the
            miseducation, and the inherited lies that were never ours to carry.
          </p>
          <p>
            We have been scattered—but not broken. Disconnected—but not lost.
            The time has come to repair the sacred bond between Black
            communities—across cities, across continents, across the diaspora.
            Whether born in Chicago, Kingston, Lagos, or London, we are one
            people with a shared history, and an unshakable future.
          </p>
          <p>
            We are not here to mimic unity—we are here to embody it. To restore
            trust. To build bridges across generational wounds. To unify our
            voices, our dollars, our vision. Our rise does not depend on
            anyone’s fall. It depends on our ability to remember who we are, and
            to walk forward—together, sovereign and whole.
          </p>
          <p className="italic text-gold">
            We are not anti-anyone.
            <br />
            We are relentlessly pro-ourselves.
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
            To promote Black-owned businesses, talent, innovation, and the
            circulation of capital within our own communities is not
            exclusion—it is creation. We are not reclaiming what was lost. We
            are establishing what was long denied. This begins at home.
          </p>
          <p>
            The foundation of this movement is rooted in domestic unity. Before
            we can reach the world, we must repair what was broken here—in the
            neighborhoods, cities, and communities across America where division
            was planted and nurtured. We are building bonds where systems sowed
            mistrust.
          </p>
          <p>
            As we unify here, the global connection follows. Our collective
            power—Black Americans, Caribbeans, Africans, and all members of the
            diaspora—strengthens as we organize at home. The movement begins
            domestically, but its resonance will echo worldwide.
          </p>
          <p>
            For generations, this nation profited from the erasure of Black
            wealth—through stolen labor, exclusionary laws, redlining, and
            structural sabotage. The residue of that legacy is still visible in
            every economic disparity we face today. We are not here to revisit
            that pain. We are here to <strong>end it.</strong>
          </p>
          <p className="font-bold text-gold">
            We are strategic.
            <br />
            We are lawful.
            <br />
            We are inevitable.
          </p>
          <p>
            We welcome allies who recognize that equity is not a threat to
            equality—it is its proof. We are not asking for permission to
            thrive. We are acting on the rights that have always belonged to us.
          </p>
          <p className="text-gold font-semibold">
            This is not just a platform.
            <br />
            This is not just a mission.
            <br />
            This is an economic awakening.
          </p>
          <p>
            A movement to establish enduring Black wealth—on our terms, in our
            voice, with the full force of law, legacy, and love behind us.
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
            href="/black-entertainment-news"
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
            href="/real-estate-investment"
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
      <footer className="bg-black text-center py-6">
        <div className="text-gray-500 text-sm space-y-2"></div>
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
