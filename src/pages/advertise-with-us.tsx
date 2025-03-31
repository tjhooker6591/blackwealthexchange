import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

const AdvertiseWithUs = () => {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [campaignDuration, setCampaignDuration] = useState<string>("");

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    setConfirmed(false);
    setBannerFile(null);
    setCampaignDuration("");
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setBannerFile(e.target.files[0]);
    }
  };

  const isReadyToProceed = confirmed && bannerFile && campaignDuration;

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
      <section
        style={{
          textAlign: "center",
          backgroundColor: "#333",
          padding: "3rem 1.5rem",
          borderRadius: "8px",
          marginBottom: "2rem",
        }}
      >
        <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#ffcc00" }}>
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
          <li>Upload your banner and set your campaign duration.</li>
          <li>Submit and pay securely online.</li>
          <li>We review and publish your ad quickly.</li>
        </ol>
      </section>

      {/* Ad Options */}
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "2rem", marginBottom: "1rem", color: "#ffcc00" }}>
          Advertising Options
        </h2>
        <p style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>
          Please choose one of the following advertising options:
        </p>
        <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: "1rem" }}>
          {[
            {
              title: "Featured Sponsor",
              description: "Highlight your brand to a dedicated, engaged audience on our homepage.",
            },
            {
              title: "Business Directory",
              description: "Get your business featured in our Black-owned business directory.",
            },
            {
              title: "Banner Ads",
              description: "Place your ads on various high-traffic pages across the platform.",
            },
            {
              title: "Custom Solutions",
              description: "Let’s work together to create a tailored advertising plan for your business.",
            },
          ].map((option) => (
            <div
              key={option.title}
              onClick={() => handleOptionSelect(option.title)}
              style={{
                cursor: "pointer",
                padding: "1rem",
                backgroundColor: "#4A4A4A",
                borderRadius: "8px",
                width: "200px",
                textAlign: "center",
                transition: "background-color 0.3s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#ffcc00")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#4A4A4A")}
            >
              <h3 style={{ fontSize: "1.5rem", color: "#fff" }}>{option.title}</h3>
              <p style={{ fontSize: "1rem", color: "#ccc" }}>{option.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Step 2: Review & Form */}
      {selectedOption && (
        <section
          style={{
            marginTop: "2rem",
            backgroundColor: "#1a1a1a",
            padding: "2rem",
            borderRadius: "8px",
          }}
        >
          <h2 style={{ fontSize: "2rem", color: "#ffcc00", textAlign: "center", marginBottom: "1rem" }}>
            Step 2: Review Your Selection & Provide Details
          </h2>

          <div
            style={{
              backgroundColor: "#2d2d2d",
              padding: "1rem",
              borderRadius: "6px",
              marginBottom: "1.5rem",
            }}
          >
            <p><strong>Selected Package:</strong> {selectedOption}</p>
            <p><strong>Description:</strong> {
              {
                "Featured Sponsor": "Highlight your brand to a dedicated, engaged audience on our homepage.",
                "Business Directory": "Get your business featured in our Black-owned business directory.",
                "Banner Ads": "Place your ads on various high-traffic pages across the platform.",
                "Custom Solutions": "Let’s work together to create a tailored advertising plan for your business.",
              }[selectedOption]
            }</p>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="banner" style={{ display: "block", marginBottom: "0.5rem" }}>
              Upload Your Banner Image:
            </label>
            <input
              type="file"
              id="banner"
              accept="image/*"
              onChange={handleBannerUpload}
              style={{ padding: "0.5rem", borderRadius: "4px", width: "100%" }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="duration" style={{ display: "block", marginBottom: "0.5rem" }}>
              Campaign Duration (in days):
            </label>
            <input
              type="number"
              id="duration"
              value={campaignDuration}
              onChange={(e) => setCampaignDuration(e.target.value)}
              placeholder="e.g. 14"
              style={{ padding: "0.5rem", borderRadius: "4px", width: "100%" }}
            />
          </div>

          <label style={{ display: "block", marginBottom: "1rem", fontSize: "1rem", textAlign: "center" }}>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              style={{ marginRight: "0.5rem" }}
            />
            I confirm this is the option I want
          </label>

          {isReadyToProceed && (
            <div style={{ textAlign: "center", marginTop: "1rem" }}>
              <Link
                href={`/checkout?option=${selectedOption}&duration=${campaignDuration}`}
                style={{
                  display: "inline-block",
                  backgroundColor: "#007bff",
                  color: "#fff",
                  padding: "0.8rem 2rem",
                  borderRadius: "4px",
                  textDecoration: "none",
                  transition: "background 0.3s",
                }}
              >
                Step 3: Proceed to Payment
              </Link>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default AdvertiseWithUs;
