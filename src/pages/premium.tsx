"use client";

import React from "react";
import Link from "next/link";

const PremiumPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-gold mb-4">
            Premium Membership
          </h1>
          <p className="text-xl text-gray-300">
            Unlock exclusive features and benefits tailored for both businesses and individuals.
          </p>
        </header>

        {/* For Businesses */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gold mb-4">For Businesses</h2>
          <p className="mb-4">
            Elevate your business with premium tools and insights that drive growth, enhanced visibility, and customer engagement.
          </p>
          <ul className="list-disc list-inside text-gray-300 mb-4">
            <li>Priority listing in our directory</li>
            <li>Enhanced analytics and performance insights</li>
            <li>Custom branding options for your profile</li>
            <li>Dedicated marketing and support</li>
            <li>Access to exclusive networking events</li>
          </ul>
          <Link href="/business-premium-signup">
            <button className="px-6 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-yellow-500 transition">
              Upgrade Your Business
            </button>
          </Link>
        </section>

        {/* For Users */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gold mb-4">For Users</h2>
          <p className="mb-4">
            Enjoy an ad-free experience, exclusive content, and market insights curated for our premium community.
          </p>
          <ul className="list-disc list-inside text-gray-300 mb-4">
            <li>Ad-free browsing experience</li>
            <li>Early access to premium content</li>
            <li>Exclusive newsletters and market insights</li>
            <li>Invitations to premium webinars and events</li>
            <li>Priority customer support</li>
          </ul>
          <Link href="/user-premium-signup">
            <button className="px-6 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-yellow-500 transition">
              Become a Premium Member
            </button>
          </Link>
        </section>

        {/* Pricing Plans */}
        <section className="text-center">
          <h2 className="text-3xl font-bold text-gold mb-4">Flexible Pricing Plans</h2>
          <p className="text-gray-300 mb-8">
            Choose a plan that fits your needs—whether you are a business owner or an individual, our premium plans offer unbeatable value.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 bg-gray-800 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold text-gold mb-2">Business Premium</h3>
              <p className="text-xl mb-4">$99/month</p>
              <ul className="list-disc list-inside text-gray-300 mb-4">
                <li>Priority Listing</li>
                <li>Advanced Analytics</li>
                <li>Custom Branding</li>
                <li>Dedicated Support</li>
              </ul>
              <Link href="/business-premium-signup">
                <button className="px-4 py-2 bg-gold text-black font-semibold rounded hover:bg-yellow-500 transition">
                  Sign Up Now
                </button>
              </Link>
            </div>
            <div className="p-6 bg-gray-800 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold text-gold mb-2">User Premium</h3>
              <p className="text-xl mb-4">$19/month</p>
              <ul className="list-disc list-inside text-gray-300 mb-4">
                <li>Ad-Free Experience</li>
                <li>Exclusive Content</li>
                <li>Premium Newsletters</li>
                <li>Priority Support</li>
              </ul>
              <Link href="/user-premium-signup">
                <button className="px-4 py-2 bg-gold text-black font-semibold rounded hover:bg-yellow-500 transition">
                  Sign Up Now
                </button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PremiumPage;
