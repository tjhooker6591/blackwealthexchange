"use client";

import React, { useState } from "react";
import { useRouter } from "next/router";

export default function BecomeASellerPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      const payload = {
        businessName,
        description,
        website,
        businessPhone,
        email,
        businessAddress,
        accountType: "seller",
        password: "temporaryPass123!",
      };

      const res = await fetch("/api/marketplace/create-seller", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Failed to create seller");

      router.push("/marketplace/add-product");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-2xl mx-auto bg-gray-900 p-6 rounded-lg border border-gold">
        <h1 className="text-2xl font-bold text-gold mb-4">Become a Seller</h1>
        <p className="text-gray-400 mb-6 text-sm">
          Set up your seller profile so you can start adding products to the marketplace.
        </p>

        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

        <div className="mb-4">
          <label className="block text-sm mb-1">Business Name</label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 border border-gray-700"
            placeholder="e.g. Culture & Co."
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm mb-1">Business Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 border border-gray-700"
            placeholder="e.g. hello@yourbusiness.com"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm mb-1">Business Phone</label>
          <input
            type="tel"
            value={businessPhone}
            onChange={(e) => setBusinessPhone(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 border border-gray-700"
            placeholder="e.g. (123) 456-7890"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm mb-1">Business Address</label>
          <input
            type="text"
            value={businessAddress}
            onChange={(e) => setBusinessAddress(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 border border-gray-700"
            placeholder="e.g. 123 Main St, City, State"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm mb-1">Business Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 border border-gray-700"
            rows={4}
            placeholder="Tell us about your business..."
          ></textarea>
        </div>

        <div className="mb-4">
          <label className="block text-sm mb-1">Website or Social Media (optional)</label>
          <input
            type="text"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 border border-gray-700"
            placeholder="https://yourbusiness.com"
          />
        </div>

        <div className="mb-4">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mr-2"
            />
            I agree to the marketplace terms and conditions.
          </label>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !(businessName && email && businessPhone && businessAddress && description && agreed)}
          className={`w-full py-2 px-4 rounded text-black font-semibold transition ${
            businessName && email && businessPhone && businessAddress && description && agreed && !loading
              ? "bg-gold hover:bg-yellow-500"
              : "bg-gray-500 cursor-not-allowed"
          }`}
        >
          {loading ? "Submitting..." : "Create Seller Profile"}
        </button>
      </div>
    </div>
  );
}
