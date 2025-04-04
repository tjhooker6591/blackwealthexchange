import React from "react";
import { useRouter } from "next/router";
import Link from "next/link";

const FreelancePage: React.FC = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-5xl mx-auto bg-gray-900 p-6 rounded-lg shadow-lg">
        {/* 🔙 Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/marketplace")}
            className="px-4 py-2 bg-gray-700 text-white font-semibold rounded hover:bg-gray-600 transition"
          >
            ← Back to Marketplace
          </button>
        </div>

        {/* 🚀 Intro */}
        <header className="mb-6">
          <h1 className="text-4xl font-bold text-gold mb-2">Freelance & Gig Work</h1>
          <p className="text-gray-300">
            Work on short-term projects or hire skilled Black freelancers. Explore gigs and find opportunities that align with your talents and goals.
          </p>
        </header>

        {/* 🔍 Overview */}
        <Section title="Overview">
          The freelance and gig economy empowers professionals to work on flexible short-term projects. Our platform bridges the gap between businesses 
          and talented Black freelancers across industries.
        </Section>

        {/* 🧠 How It Works */}
        <Section title="How It Works">
          We operate on a subscription model. Instead of paying per gig, both freelancers and clients gain unlimited access to each other for the 
          duration of their membership.
        </Section>

        {/* 💼 Subscription Benefits */}
        <Section title="Subscription Benefits">
          <ul className="list-disc ml-6 text-gray-300 space-y-2">
            <li>Freelancers are paid consistently and fairly.</li>
            <li>Clients gain flexible access to skilled talent.</li>
            <li>Build long-term project relationships without extra fees.</li>
            <li>Rate & review systems ensure high quality on both sides.</li>
          </ul>
        </Section>

        {/* 🔎 Explore Gigs */}
        <Section title="Explore Gigs">
          <p className="text-gray-300 mb-4">
            Whether you are a freelancer or a business seeking support, start your journey here.
          </p>
          <Link href="/explore-gigs">
            <button className="px-5 py-2 bg-green-600 text-white font-semibold rounded hover:bg-green-700 transition">
              Explore Gigs
            </button>
          </Link>
        </Section>

        {/* 🛡️ Ensuring Quality */}
        <Section title="How We Ensure Quality">
          <ul className="list-disc ml-6 text-gray-300 space-y-2">
            <li><strong>Freelancer Ratings:</strong> Clients provide feedback after each gig.</li>
            <li><strong>Client Reviews:</strong> Freelancers can rate clients too.</li>
            <li><strong>Dispute Resolution:</strong> We offer support to resolve conflicts.</li>
            <li><strong>Verified Payments:</strong> All transactions are secured through our platform.</li>
          </ul>
        </Section>

        {/* 🎯 Call to Action */}
        <Section title="Get Started">
          <p className="text-gray-300 mb-4">
            Subscribe today to gain access to an ongoing stream of talent and opportunity.
          </p>
          <Link href="/subscribe">
            <button className="px-5 py-2 bg-gold text-black font-semibold rounded hover:bg-yellow-500 transition">
              Subscribe Now
            </button>
          </Link>
        </Section>
      </div>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mt-10">
    <h2 className="text-2xl font-bold text-blue-400 mb-3">{title}</h2>
    <div className="text-gray-300">{children}</div>
  </section>
);

export default FreelancePage;
