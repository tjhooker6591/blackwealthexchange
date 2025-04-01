"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function CustomAd() {
  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const [email, setEmail] = useState("");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Ideally, you’d POST this to an API route or email service
    console.log({ name, business, email, details });

    // Simulate submission
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12 flex flex-col items-center text-center">
      <div className="max-w-3xl w-full">
        <h1 className="text-4xl font-bold text-gold mb-4">
          Custom Advertising Solutions
        </h1>
        <p className="text-lg text-gray-400 mb-6">
          Want to build something unique and powerful for your brand? Let is
          collaborate on a custom advertising package that fits your goals and
          budget.
        </p>

        {/* Breakdown of what’s possible */}
        <div className="bg-gray-800 p-6 rounded-lg text-left mb-10">
          <h2 className="text-2xl text-gold font-semibold mb-4">
            What is Possible?
          </h2>
          <ul className="list-disc list-inside space-y-3 text-gray-300">
            <li>Sponsored homepage takeovers or highlight sections</li>
            <li>Exclusive email newsletter features</li>
            <li>Custom landing pages for your campaign</li>
            <li>Event, webinar, or product launch partnerships</li>
            <li>Long-term brand partnership opportunities</li>
            <li>Social media campaigns + audience targeting</li>
          </ul>
        </div>

        {/* Custom Request Form */}
        {!submitted ? (
          <form
            onSubmit={handleSubmit}
            className="bg-gray-900 p-6 rounded-lg shadow-md text-left space-y-4"
          >
            <h3 className="text-xl text-gold font-bold mb-2 text-center">
              Tell Us What You Need
            </h3>

            <div>
              <label className="block mb-1 text-sm">Your Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 text-white"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm">Business Name</label>
              <input
                type="text"
                required
                value={business}
                onChange={(e) => setBusiness(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 text-white"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 text-white"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm">
                Tell Us About Your Campaign
              </label>
              <textarea
                required
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 text-white min-h-[120px]"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-4 py-2 px-4 bg-gold text-black font-semibold rounded hover:bg-yellow-400 transition"
            >
              Submit Custom Request
            </button>
          </form>
        ) : (
          <div className="bg-green-600 text-white p-6 rounded-lg">
            <h3 className="text-2xl font-semibold mb-2">Thank You!</h3>
            <p>
              We are received your request. A member of our team will follow up
              shortly to discuss your custom advertising needs.
            </p>
          </div>
        )}

        {/* Back to Ad Options */}
        <div className="mt-10">
          <Link href="/advertise-with-us">
            <button className="px-6 py-2 bg-gold text-black font-semibold rounded hover:bg-yellow-400 transition">
              Back to Ad Options
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
