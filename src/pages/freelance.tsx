import React from "react";
import { useRouter } from "next/router";
import Link from "next/link";

const FreelanceGigPage: React.FC = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
        {/* Back Button */}
        <div className="mb-4">
          <button
            onClick={() => router.push("/marketplace")}
            className="px-4 py-2 bg-gray-600 text-white font-bold rounded hover:bg-gray-700 transition"
          >
            Back to Marketplace
          </button>
        </div>

        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gold">Freelance & Gig Work</h1>
          <p className="text-gray-300 mt-2">
            Work on short-term projects or hire Black freelancers for specialized skills. Explore gigs and find opportunities that match your expertise.
          </p>
        </header>

        {/* Freelance Overview Section */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">Overview</h2>
          <p className="text-gray-300">
            The freelance and gig economy offers flexible work opportunities that allow you to take on short-term projects and get paid for your specialized skills. Whether you are looking to work as a freelancer or hire talented Black professionals for gigs, our platform connects people with the right skills to clients who need their expertise. 
          </p>
        </section>

        {/* How it Works Section */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">How It Works</h2>
          <p className="text-gray-300">
            We operate on a subscription-based model, meaning that freelancers and clients get access to ongoing opportunities and projects without having to pay per job or project. By subscribing, clients can find the right freelancers for their needs, and freelancers get the opportunity to work on various projects throughout their subscription period.
          </p>
        </section>

        {/* Subscription Model Explanation */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">Subscription Model</h2>
          <p className="text-gray-300">
            Our subscription service ensures that both freelancers and clients get the best value for their commitment. With the subscription:
          </p>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            <li>Freelancers are paid regularly, ensuring a steady income stream.</li>
            <li>Clients have access to a pool of skilled freelancers for their projects without paying per job.</li>
            <li>Both freelancers and clients are encouraged to build long-term relationships and work on multiple projects during the subscription period.</li>
            <li>We guarantee quality through a rating and review system where freelancers are rated based on their work, and clients are rated based on their feedback.</li>
          </ul>
        </section>

        {/* Explore Gigs Section */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">Explore Gigs</h2>
          <p className="text-gray-300">
            Whether you're a freelancer looking for your next opportunity or a client needing specific skills, explore the available gigs below. Find the perfect match for your needs, and start building your professional network.
          </p>
          <Link href="/explore-gigs">
            <button className="mt-4 py-2 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition">
              Explore Gigs
            </button>
          </Link>
        </section>

        {/* How We Ensure Quality Section */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">How We Ensure Quality</h2>
          <p className="text-gray-300">
            We prioritize a seamless experience for both freelancers and clients. To ensure you get what you pay for:
          </p>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            <li><strong>Freelancer Reviews:</strong> After each project, clients can rate freelancers based on their work, professionalism, and communication skills.</li>
            <li><strong>Client Reviews:</strong> Freelancers can also rate clients, ensuring that both parties maintain a high level of professionalism.</li>
            <li><strong>Dispute Resolution:</strong> In the event of an issue, we offer support for conflict resolution to ensure both freelancers and clients are satisfied with the outcome.</li>
            <li><strong>Verified Payments:</strong> We handle payments securely through our platform, ensuring freelancers are paid promptly and fairly.</li>
          </ul>
        </section>

        {/* Call to Action */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">Get Started</h2>
          <p className="text-gray-300">
            Ready to start working on exciting projects or hire Black professionals for your business needs? Subscribe today and take advantage of the subscription model that gives you ongoing access to talented freelancers.
          </p>
          <Link href="/subscribe">
            <button className="mt-4 py-2 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition">
              Subscribe Now
            </button>
          </Link>
        </section>
      </div>
    </div>
  );
};

export default FreelanceGigPage;