import React from "react";
import Link from "next/link";

export default function Community() {
  return (
    <div className="bg-white text-black min-h-screen">
      {/* Header */}
      <header className="hero bg-center bg-cover p-20 text-center bg-gold text-black">
        <h1 className="text-4xl font-bold">BWE Community</h1>
        <p className="text-lg mt-4 font-medium">
          Connect, Learn, and Grow Together
        </p>
      </header>

      <div className="container mx-auto p-6">
        {/* Discussion Forum Section */}
        <div className="bg-gray-100 p-6 my-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gold">Join the Conversation</h2>
          <p className="text-gray-600">
            Engage in discussions about business, finance, and community growth.
          </p>
          <div className="mt-4 grid gap-4 grid-cols-1 md:grid-cols-3">
            <div className="bg-gray-200 p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-bold">Entrepreneurship</h3>
              <p className="text-gray-600">
                Tips, strategies, and success stories from Black business owners.
              </p>
            </div>
            <div className="bg-gray-200 p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-bold">Investing</h3>
              <p className="text-gray-600">
                Discuss investment opportunities, wealth-building, and financial literacy.
              </p>
            </div>
            <div className="bg-gray-200 p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-bold">Networking</h3>
              <p className="text-gray-600">
                Connect with like-minded professionals and grow your network.
              </p>
            </div>
          </div>
        </div>

        {/* Upcoming Events Section */}
        <div className="bg-gray-100 p-6 my-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gold">Upcoming Community Events</h2>
          <p className="text-gray-600">
            Stay updated with upcoming networking events, webinars, and mentorship programs.
          </p>
          <div className="mt-4 grid gap-4 grid-cols-1 md:grid-cols-2">
            <div className="bg-gray-200 p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-bold">Virtual Business Expo</h3>
              <p className="text-gray-600">
                Meet Black entrepreneurs showcasing their businesses.
              </p>
            </div>
            <div className="bg-gray-200 p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-bold">Financial Literacy Webinar</h3>
              <p className="text-gray-600">
                Learn wealth-building strategies from financial experts.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center p-6">
        <h2 className="text-xl font-bold text-gray-800">Be Part of the Movement</h2>
        <button className="px-6 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-opacity-90 transition mt-4">
          Join Now
        </button>
      </div>

      {/* ✅ Back to Home Button */}
      <div className="text-center my-8">
        <Link href="/">
          <button className="px-6 py-3 bg-gray-800 text-white font-semibold rounded-lg hover:bg-black transition">
            ← Back to Home
          </button>
        </Link>
      </div>
    </div>
  );
}