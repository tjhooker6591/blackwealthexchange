"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

interface FormData {
  full_name: string;
  email: string;
  business_name: string;
  website: string;
  category: string;
  description: string;
}

export default function SellerRegister() {
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    full_name: "",
    email: "",
    business_name: "",
    website: "",
    category: "",
    description: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/marketplace/create-seller", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessName: formData.business_name,
          email: formData.email,
          password: formData.full_name, // adjust as needed
          businessAddress: formData.website, // adjust as needed
          businessPhone: formData.category, // adjust as needed
          description: formData.description,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        // Registration succeeded → redirect to generic login,
        // tagging it as a seller login
        router.push("/login?accountType=seller");
      } else {
        // Show server‑side error
        alert(data.error || "Failed to register. Please try again.");
      }
    } catch (error) {
      console.error("Error registering seller:", error);
      alert("Failed to register. Please try again.");
    }
  };

  return (
    <div className="bg-black text-white min-h-screen flex flex-col items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-lg shadow-lg w-full max-w-lg">
        <h1 className="text-3xl font-bold text-gold mb-6">Become a Seller</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="full_name"
            placeholder="Full Name"
            value={formData.full_name}
            onChange={handleChange}
            className="w-full p-3 rounded bg-gray-800 text-white"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-3 rounded bg-gray-800 text-white"
            required
          />
          <input
            type="text"
            name="business_name"
            placeholder="Business Name"
            value={formData.business_name}
            onChange={handleChange}
            className="w-full p-3 rounded bg-gray-800 text-white"
            required
          />
          <input
            type="url"
            name="website"
            placeholder="Website (optional)"
            value={formData.website}
            onChange={handleChange}
            className="w-full p-3 rounded bg-gray-800 text-white"
          />
          <input
            type="text"
            name="category"
            placeholder="Business Category"
            value={formData.category}
            onChange={handleChange}
            className="w-full p-3 rounded bg-gray-800 text-white"
          />
          <textarea
            name="description"
            placeholder="Business Description"
            value={formData.description}
            onChange={handleChange}
            className="w-full p-3 rounded bg-gray-800 text-white"
            rows={4}
          />
          <button
            type="submit"
            className="w-full p-3 bg-gold text-black font-bold rounded hover:bg-yellow-400 transition"
          >
            Submit
          </button>
        </form>
      </div>

      <div className="mt-6">
        <Link href="/">
          <button className="p-4 bg-white text-black font-bold rounded-lg shadow-lg hover:bg-gold hover:text-black transition duration-300">
            Back to Homepage
          </button>
        </Link>
      </div>
    </div>
  );
}
