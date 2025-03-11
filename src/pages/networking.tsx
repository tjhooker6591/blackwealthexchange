import React from "react";
import { useRouter } from "next/router";
import Link from "next/link";

const ProfessionalNetworking: React.FC = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/jobs")}
            className="px-6 py-3 bg-gray-600 text-white font-bold rounded-md hover:bg-gray-700 transition"
          >
            Back to Job Listings
          </button>
        </div>

        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gold">Professional Networking Community</h1>
          <p className="text-gray-300 mt-4 text-xl">
            Build your network. Expand your opportunities. Empower your career.
          </p>
        </header>

        {/* About Networking Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-blue-500">Why Join Our Networking Community?</h2>
          <p className="text-gray-300 mt-4 text-lg">
            Our Professional Networking Community is a space dedicated to connecting Black professionals across all industries. Whether you’re looking to share insights, learn from others, or grow your career, this community is your gateway to success.
          </p>
        </section>

        {/* Benefits of Joining */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold mb-6">
              <i className="fas fa-users"></i>
            </div>
            <h3 className="text-xl font-semibold text-blue-500">Expand Your Professional Network</h3>
            <p className="text-gray-300 text-lg mt-4 text-center">
              Connect with other professionals, exchange knowledge, and build relationships that can help you unlock new career opportunities.
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold mb-6">
              <i className="fas fa-briefcase"></i>
            </div>
            <h3 className="text-xl font-semibold text-blue-500">Opportunities for Collaboration</h3>
            <p className="text-gray-300 text-lg mt-4 text-center">
              Collaborate with fellow professionals on projects, initiatives, or business ventures. Leverage shared knowledge and resources to achieve mutual success.
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold mb-6">
              <i className="fas fa-lightbulb"></i>
            </div>
            <h3 className="text-xl font-semibold text-blue-500">Share Insights and Grow Together</h3>
            <p className="text-gray-300 text-lg mt-4 text-center">
              Share your experiences, gain valuable insights from others, and learn about industry trends, best practices, and career tips.
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold mb-6">
              <i className="fas fa-handshake"></i>
            </div>
            <h3 className="text-xl font-semibold text-blue-500">Support Each Other’s Success</h3>
            <p className="text-gray-300 text-lg mt-4 text-center">
              Empower each other by sharing opportunities, offering support, and creating a space where Black professionals can thrive and grow.
            </p>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="mb-12 text-center">
          <Link href="/networking">
            <button className="py-4 px-6 bg-green-600 text-white text-xl font-semibold rounded-lg hover:bg-green-700 transition">
              Join the Networking Community
            </button>
          </Link>
        </section>

        {/* Testimonials Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-blue-500 text-center">What Members Are Saying</h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-gray-700 p-6 rounded-lg shadow-md">
              <blockquote className="text-gray-300 text-lg">
                “This community has opened doors for me that I didn’t even know existed. The knowledge and support I’ve received here have been invaluable for my career growth.”
              </blockquote>
              <footer className="mt-6 text-blue-500 text-right">– Sarah W., Marketing Executive</footer>
            </div>

            <div className="bg-gray-700 p-6 rounded-lg shadow-md">
              <blockquote className="text-gray-300 text-lg">
                “I’ve been able to collaborate on multiple projects with other professionals here. It’s been a game-changer for my business. Highly recommend joining.”
              </blockquote>
              <footer className="mt-6 text-blue-500 text-right">– James M., Entrepreneur</footer>
            </div>
          </div>
        </section>

        {/* Footer Section */}
        <section className="text-center">
          <p className="text-gray-300">
            By joining the Professional Networking Community, you take the next step in advancing your career and making meaningful connections.
          </p>
        </section>
      </div>
    </div>
  );
};

export default ProfessionalNetworking;