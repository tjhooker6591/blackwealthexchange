"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

interface FormData {
  fullName: string;
  email: string;
  password: string;

  businessName: string;
  website: string;
  category: string;

  phone: string;
  address: string;

  description: string;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function SellerRegister() {
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    password: "",

    businessName: "",
    website: "",
    category: "",

    phone: "",
    address: "",

    description: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const canSubmit = useMemo(() => {
    return (
      formData.fullName.trim().length > 1 &&
      isValidEmail(formData.email) &&
      formData.password.length >= 8 &&
      formData.businessName.trim().length > 1 &&
      formData.description.trim().length > 10
    );
  }, [formData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!isValidEmail(formData.email)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (formData.password.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      return;
    }
    if (!formData.businessName.trim()) {
      setErrorMsg("Business name is required.");
      return;
    }
    if (formData.description.trim().length < 10) {
      setErrorMsg("Please add a short description (at least 10 characters).");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/marketplace/create-seller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,

          businessName: formData.businessName.trim(),
          website: formData.website.trim(),
          category: formData.category.trim(),

          businessPhone: formData.phone.trim(),
          businessAddress: formData.address.trim(),

          description: formData.description.trim(),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || data?.message || "Failed to register seller.");
      }

      setSuccessMsg("✅ Seller account created! Redirecting to login…");

      // Send them to login as seller + bring them to dashboard after login
      setTimeout(() => {
        router.push("/login?accountType=seller&redirect=/marketplace/dashboard");
      }, 900);
    } catch (error: unknown) {
      console.error("Error registering seller:", error);
      setErrorMsg(error instanceof Error ? error.message : "Failed to register seller.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-14">
      <div className="w-full max-w-2xl bg-gray-900 border border-gold rounded-xl shadow-lg p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gold">Become a Seller</h1>
            <p className="text-gray-400 mt-2">
              Create your seller profile so you can list products and manage orders.
            </p>
          </div>
          <Link href="/marketplace">
            <button className="px-4 py-2 border border-gray-700 rounded hover:bg-gray-800 transition">
              ← Marketplace
            </button>
          </Link>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mt-6 rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mt-6 rounded border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-200">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Account Info */}
          <div className="rounded-lg border border-gray-800 bg-black/30 p-5">
            <h2 className="text-gold font-semibold mb-4">Account Information</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full p-3 rounded bg-gray-800 text-white border border-gray-700 focus:ring-2 focus:ring-gold"
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-3 rounded bg-gray-800 text-white border border-gray-700 focus:ring-2 focus:ring-gold"
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password (min 8 chars)"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-3 rounded bg-gray-800 text-white border border-gray-700 focus:ring-2 focus:ring-gold md:col-span-2"
                required
              />
            </div>

            <p className="text-xs text-gray-400 mt-3">
              Passwords are stored securely (hashed) — never share them with anyone.
            </p>
          </div>

          {/* Business Info */}
          <div className="rounded-lg border border-gray-800 bg-black/30 p-5">
            <h2 className="text-gold font-semibold mb-4">Business Details</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                name="businessName"
                placeholder="Business Name"
                value={formData.businessName}
                onChange={handleChange}
                className="w-full p-3 rounded bg-gray-800 text-white border border-gray-700 focus:ring-2 focus:ring-gold"
                required
              />
              <input
                type="text"
                name="category"
                placeholder="Business Category (e.g., Fashion, Books, Beauty)"
                value={formData.category}
                onChange={handleChange}
                className="w-full p-3 rounded bg-gray-800 text-white border border-gray-700 focus:ring-2 focus:ring-gold"
              />
              <input
                type="url"
                name="website"
                placeholder="Website (optional)"
                value={formData.website}
                onChange={handleChange}
                className="w-full p-3 rounded bg-gray-800 text-white border border-gray-700 focus:ring-2 focus:ring-gold"
              />
              <input
                type="tel"
                name="phone"
                placeholder="Business Phone (optional)"
                value={formData.phone}
                onChange={handleChange}
                className="w-full p-3 rounded bg-gray-800 text-white border border-gray-700 focus:ring-2 focus:ring-gold"
              />
              <input
                type="text"
                name="address"
                placeholder="Business Address (optional)"
                value={formData.address}
                onChange={handleChange}
                className="w-full p-3 rounded bg-gray-800 text-white border border-gray-700 focus:ring-2 focus:ring-gold md:col-span-2"
              />
              <textarea
                name="description"
                placeholder="Business Description (tell customers what you sell)"
                value={formData.description}
                onChange={handleChange}
                className="w-full p-3 rounded bg-gray-800 text-white border border-gray-700 focus:ring-2 focus:ring-gold md:col-span-2"
                rows={5}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className={`w-full p-3 font-bold rounded transition ${
              !canSubmit || submitting
                ? "bg-gray-600 text-gray-200 cursor-not-allowed"
                : "bg-gold text-black hover:bg-yellow-400"
            }`}
          >
            {submitting ? "Submitting…" : "Create Seller Account"}
          </button>

          <div className="text-center text-sm text-gray-400">
            Already have a seller account?{" "}
            <Link
              href="/login?accountType=seller"
              className="text-gold hover:underline"
            >
              Login here
            </Link>
          </div>
        </form>
      </div>

      <div className="mt-6">
        <Link href="/">
          <button className="px-6 py-3 bg-white text-black font-bold rounded-lg shadow-lg hover:bg-gold transition">
            Back to Homepage
          </button>
        </Link>
      </div>
    </div>
  );
}
