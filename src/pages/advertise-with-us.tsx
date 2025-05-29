"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import BuyNowButton from "@/components/BuyNowButton";

const AdvertiseWithUs = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      {/* Back Button */}
      <section style={{ textAlign: "left" }}>
        <button
          onClick={() => router.back()}
          style={{
            padding: "0.8rem 1.5rem",
            backgroundColor: "#000",
            color: "#fff",
            borderRadius: "4px",
            textDecoration: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          Back
        </button>
      </section>

      {/* Banner */}
      <section className="mb-8">
        <h1
          style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#ffcc00" }}
        >
          Want to increase visibility for your business?
        </h1>
        <p style={{ fontSize: "1.1rem", marginTop: "1rem" }}>
          We offer a variety of advertising options to help you reach a larger,
          engaged audience. Please select an option below to proceed.
        </p>
      </section>

      {/* Benefits */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {[
          {
            title: "Wide Reach",
            text: "Engage thousands of monthly visitors who are actively looking to support Black-owned businesses.",
          },
          {
            title: "Flexible Ad Placements",
            text: "Choose from homepage banners, category highlights, or featured directory listings.",
          },
          {
            title: "Affordable Packages",
            text: "Ad tiers for every budget—from small businesses to large sponsors.",
          },
        ].map((item) => (
          <div key={item.title} className="p-6 bg-gray-800 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
            <p>{item.text}</p>
          </div>
        ))}
      </section>

      {/* How it Works */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-center mb-4">How It Works</h2>
        <ol className="list-decimal list-inside space-y-2 max-w-xl mx-auto text-lg">
          <li>Choose your ad package.</li>
          <li>Review pricing and placement options.</li>
          <li>Submit your details and upload banner (if applicable).</li>
          <li>Pay securely and reserve your slot.</li>
          <li>Our team reviews and publishes your ad.</li>
        </ol>
      </section>

      {/* Ad Options */}
      <section style={{ marginBottom: "2rem" }}>
        <h2
          style={{ fontSize: "2rem", marginBottom: "1rem", color: "#ffcc00" }}
        >
          Advertising Options
        </h2>
        <p style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>
          Please choose one of the following advertising options:
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          {[
            {
              title: "Featured Sponsor",
              description:
                "Highlight your brand to a dedicated, engaged audience on our homepage.",
              href: "/advertise/featured-sponsor",
            },
            {
              title: "Business Directory",
              description:
                "Get your business featured in our Black-owned business directory.",
              href: "/advertise/business-directory",
            },
            {
              title: "Banner Ads",
              description:
                "Place your ads on various high-traffic pages across the platform.",
              href: "/advertise/banner-ads",
            },
            {
              title: "Custom Solutions",
              description:
                "Let’s work together to create a tailored advertising plan for your business.",
              href: "/advertise/custom",
            },
          ].map((option) => (
            <Link key={option.title} href={option.href}>
              <div
                style={{
                  cursor: "pointer",
                  padding: "1rem",
                  backgroundColor: "#4A4A4A",
                  borderRadius: "8px",
                  width: "200px",
                  textAlign: "center",
                  transition: "background-color 0.3s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#ffcc00")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#4A4A4A")
                }
              >
                <h3 style={{ fontSize: "1.5rem", color: "#fff" }}>
                  {option.title}
                </h3>
                <p style={{ fontSize: "1rem", color: "#ccc" }}>
                  {option.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Example Buy Button for Sponsored Listing */}
      <section className="text-center mt-12">
        <h3 className="text-xl font-semibold mb-4 text-white">
          Try an Instant Purchase
        </h3>
        <BuyNowButton
          userId="replace-with-user-id"
          itemId="example-sponsor-package"
          amount={75}
          type="ad"
        />
      </section>
    </div>
  );
};

export default AdvertiseWithUs;
