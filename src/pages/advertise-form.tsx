import React, { useState } from "react";
import { useRouter } from "next/router";

const AdvertiseForm = () => {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    businessName: "",
    email: "",
    description: "",
  });
  const [status, setStatus] = useState("");

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Submitting your ad...");
    try {
      const res = await fetch("/api/advertising/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, adType: selectedOption }),
      });

      if (res.ok) {
        setStatus(
          "Thank you! Your ad request has been received. Payment is currently disabled — we will contact you to complete the process.",
        );
        setFormData({ businessName: "", email: "", description: "" });
        setSelectedOption(null);
      } else {
        setStatus("Submission failed. Please try again.");
      }
    } catch (err) {
      console.error("Submission error:", err);
      setStatus("An error occurred. Please try again later.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
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

      <section
        style={{
          textAlign: "center",
          backgroundColor: "#333",
          padding: "3rem 1.5rem",
          borderRadius: "8px",
          marginBottom: "2rem",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h1
          style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#ffcc00" }}
        >
          Want to increase visibility for your business?
        </h1>
        <p style={{ fontSize: "1.1rem", marginTop: "1rem" }}>
          We offer a variety of advertising options to help you reach a larger,
          engaged audience. Please select an option below to proceed.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="p-6 bg-gray-800 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-2">Wide Reach</h3>
          <p>
            Engage thousands of monthly visitors who are actively looking to
            support Black-owned businesses.
          </p>
        </div>
        <div className="p-6 bg-gray-800 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-2">Flexible Ad Placements</h3>
          <p>
            Choose from homepage banners, category highlights, or featured
            directory listings.
          </p>
        </div>
        <div className="p-6 bg-gray-800 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-2">Affordable Packages</h3>
          <p>
            Ad tiers for every budget—from small businesses to large sponsors.
          </p>
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-2xl font-bold text-center mb-4">How It Works</h2>
        <ol className="list-decimal list-inside space-y-2 max-w-xl mx-auto text-lg">
          <li>Choose your ad package.</li>
          <li>Upload your banner or fill in text details.</li>
          <li>Submit your request (payment currently disabled).</li>
          <li>We review and contact you to finalize the ad.</li>
        </ol>
      </section>

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
            "Featured Sponsor",
            "Business Directory",
            "Banner Ads",
            "Custom Solutions",
          ].map((option) => (
            <div
              key={option}
              onClick={() => handleOptionSelect(option)}
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
              <h3 style={{ fontSize: "1.5rem", color: "#fff" }}>{option}</h3>
            </div>
          ))}
        </div>
      </section>

      {selectedOption && (
        <section className="max-w-xl mx-auto bg-gray-800 p-6 rounded shadow">
          <h2 className="text-2xl font-bold text-center mb-4 text-white">
            Submit Your Ad - {selectedOption}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              placeholder="Business Name"
              className="w-full p-2 rounded bg-gray-700 text-white"
              required
            />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              className="w-full p-2 rounded bg-gray-700 text-white"
              required
            />
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Ad Description"
              rows={4}
              className="w-full p-2 rounded bg-gray-700 text-white"
              required
            />
            <button
              type="submit"
              className="w-full py-2 bg-gold text-black font-bold rounded hover:bg-yellow-400 transition"
            >
              Submit Ad Request
            </button>
            {status && <p className="text-center text-sm mt-2">{status}</p>}
          </form>
        </section>
      )}
    </div>
  );
};

export default AdvertiseForm;
