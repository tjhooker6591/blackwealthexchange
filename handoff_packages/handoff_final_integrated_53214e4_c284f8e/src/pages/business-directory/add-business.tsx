// File: pages/business-directory/add-business.tsx
"use client";

import React, { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { normalizeOptionalUrl } from "@/lib/businessSubmission";

export default function AddBusinessForm() {
  const router = useRouter();

  const [businessName, setBusinessName] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [website, setWebsite] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [facebook, setFacebook] = useState<string>("");
  const [twitter, setTwitter] = useState<string>("");

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append("businessName", businessName.trim());
      formData.append("category", category.trim().toLowerCase());
      formData.append("location", location.trim());
      formData.append("phone", phone.trim());
      formData.append("email", email.trim().toLowerCase());
      formData.append("website", normalizeOptionalUrl(website));
      formData.append("description", description.trim());
      if (logoFile) {
        formData.append("logo", logoFile);
      }
      formData.append("facebook", normalizeOptionalUrl(facebook));
      formData.append("twitter", normalizeOptionalUrl(twitter));

      const res = await fetch("/api/business/create", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            "We could not submit your business. Please check your information and try again.",
        );
      }

      setSuccessMessage(
        data?.message ||
          "Your business was submitted for review. We’ll review it and publish it once approved.",
      );

      setTimeout(() => {
        router.push("/business-directory");
      }, 2200);
    } catch (err: any) {
      setError(
        err?.message ||
          "We could not submit your business. Please check your information and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (successMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4 sm:p-8">
        <div className="w-full max-w-lg bg-gray-800 p-6 rounded-lg shadow text-center">
          <h2 className="text-2xl font-bold text-gold mb-4">
            🎉 Business Submitted
          </h2>
          <p className="text-gray-300 mb-6 leading-relaxed">{successMessage}</p>
          <button
            onClick={() => router.push("/business-directory")}
            className="px-4 py-2 bg-gold text-black font-bold rounded hover:bg-yellow-500 transition"
          >
            Go to Directory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen p-4 sm:p-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl sm:text-4xl font-bold text-gold">Add Your Business</h1>
      </header>

      <div className="max-w-4xl mx-auto bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg">
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm sm:text-base text-red-200 leading-relaxed">
            <strong className="block text-red-100">We couldn’t submit your business yet.</strong>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-5">
          <fieldset>
            <legend className="text-xl font-bold text-gold">Basic Information</legend>
            <label className="block mt-3">
              <span className="block">Business Name</span>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                className="w-full p-2 rounded bg-gray-700 text-white mt-1"
              />
            </label>
            <label className="block mt-3">
              <span className="block">Category</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full p-2 rounded bg-gray-700 text-white mt-1"
              >
                <option value="">Select Category</option>
                <option value="tech">Tech</option>
                <option value="beauty">Beauty</option>
                <option value="food">Food</option>
                <option value="fashion">Fashion</option>
              </select>
            </label>
            <label className="block mt-3">
              <span className="block">Location</span>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, State (for example: Allentown, PA)"
                required
                className="w-full p-2 rounded bg-gray-700 text-white mt-1"
              />
              <span className="mt-1 block text-xs text-gray-400">
                We can normalize entries like “Allentown pa”, but clearer formatting helps.
              </span>
            </label>
          </fieldset>

          <fieldset>
            <legend className="text-xl font-bold text-gold">Contact Information</legend>
            <label className="block mt-3">
              <span className="block">Phone Number</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full p-2 rounded bg-gray-700 text-white mt-1"
              />
            </label>
            <label className="block mt-3">
              <span className="block">Email Address</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-2 rounded bg-gray-700 text-white mt-1"
              />
            </label>
            <label className="block mt-3">
              <span className="block">Website URL <span className="text-gray-400">(optional)</span></span>
              <input
                type="text"
                inputMode="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="yourbusiness.com"
                className="w-full p-2 rounded bg-gray-700 text-white mt-1"
              />
            </label>
          </fieldset>

          <fieldset>
            <legend className="text-xl font-bold text-gold">Business Profile</legend>
            <label className="block mt-3">
              <span className="block">Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                required
                className="w-full p-2 rounded bg-gray-700 text-white mt-1"
              />
            </label>
          </fieldset>

          <fieldset>
            <legend className="text-xl font-bold text-gold">Logo Upload</legend>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setLogoFile(e.target.files ? e.target.files[0] : null)
              }
              className="w-full p-2 rounded bg-gray-700 text-white mt-2"
            />
          </fieldset>

          <fieldset>
            <legend className="text-xl font-bold text-gold">Social Media</legend>
            <label className="block mt-3">
              <span className="block">Facebook <span className="text-gray-400">(optional)</span></span>
              <input
                type="text"
                inputMode="url"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="facebook.com/yourbusiness"
                className="w-full p-2 rounded bg-gray-700 text-white mt-1"
              />
            </label>
            <label className="block mt-3">
              <span className="block">Twitter/X <span className="text-gray-400">(optional)</span></span>
              <input
                type="text"
                inputMode="url"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                placeholder="x.com/yourbusiness"
                className="w-full p-2 rounded bg-gray-700 text-white mt-1"
              />
            </label>
          </fieldset>

          <button
            type="submit"
            disabled={submitting}
            className="w-full p-4 bg-gold text-black font-bold rounded hover:bg-yellow-500 transition disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit Business"}
          </button>
        </form>
      </div>
    </div>
  );
}
