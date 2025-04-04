import React from "react";
import { useRouter } from "next/router";
import Link from "next/link";

const InternshipsPage: React.FC = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-5xl mx-auto bg-gray-900 p-6 rounded-lg shadow-lg">
        {/* 🔙 Back to Jobs */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/jobs")}
            className="px-4 py-2 bg-gray-700 text-white font-semibold rounded hover:bg-gray-600 transition"
          >
            ← Back to Jobs
          </button>
        </div>

        {/* 🚀 Header */}
        <header className="mb-6">
          <h1 className="text-4xl font-bold text-gold mb-2">
            Internships & College Opportunities
          </h1>
          <p className="text-gray-300">
            Gain early career experience with internships and apprenticeships.
            Open doors and prepare for success.
          </p>
        </header>

        {/* 🧭 Overview */}
        <Section title="Overview">
          Internships and apprenticeships give you real-world experience and
          develop your skills before entering the workforce full-time. Explore
          your interests, gain confidence, and build your network through our
          curated opportunities.
        </Section>

        {/* 📘 Why Internships Matter */}
        <Section title="Why Internships Matter">
          <ul className="list-disc ml-6 space-y-2 text-gray-300">
            <li>
              <strong>Real-World Experience:</strong> Stand out to employers
              with hands-on exposure.
            </li>
            <li>
              <strong>Networking:</strong> Connect with professionals and
              organizations in your field.
            </li>
            <li>
              <strong>Skill Building:</strong> Learn communication, teamwork,
              problem-solving, and more.
            </li>
            <li>
              <strong>Career Pathway:</strong> Many internships lead to
              full-time employment.
            </li>
          </ul>
        </Section>

        {/* 📂 Available Opportunities */}
        <Section title="Available Opportunities">
          <p className="text-gray-300">
            From tech and finance to healthcare and design, discover internships
            and apprenticeships that match your goals. Browse listings and apply
            directly to participating organizations.
          </p>
        </Section>

        {/* 🚀 Next Steps */}
        <Section title="Next Steps">
          <p className="text-gray-300">
            Click the button below to explore available internship programs and
            get started on your career journey.
          </p>
          <Link href="/view-internships">
            <button className="mt-4 py-2 px-5 bg-green-600 text-white font-semibold rounded hover:bg-green-700 transition">
              View Internships
            </button>
          </Link>
        </Section>

        {/* 💬 Testimonials */}
        <Section title="What Others Are Saying">
          <blockquote className="text-gray-300 italic border-l-4 border-gold pl-4 mt-2">
            My internship gave me the confidence and experience to land my first
            job after college. Highly recommended! – John S., Former Intern
          </blockquote>
        </Section>

        {/* 🎁 Benefits */}
        <Section title="Program Benefits">
          <ul className="list-disc ml-6 space-y-2 text-gray-300">
            <li>Hands-on experience across industries.</li>
            <li>Networking with professionals and hiring managers.</li>
            <li>Skill development in real working environments.</li>
            <li>Mentorship and personal career coaching.</li>
          </ul>
        </Section>
      </div>
    </div>
  );
};

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="mt-10">
    <h2 className="text-2xl font-bold text-blue-400 mb-3">{title}</h2>
    <div>{children}</div>
  </section>
);

export default InternshipsPage;
