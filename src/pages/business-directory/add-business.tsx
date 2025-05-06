// File: pages/business-directory/add-business.tsx
"use client";

import React, { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function AddBusinessForm() {
  const router = useRouter();

  // form state
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
  const [success, setSuccess] = useState<boolean>(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("businessName", businessName);
      formData.append("category", category);
      formData.append("location", location);
      formData.append("phone", phone);
      formData.append("email", email);
      formData.append("website", website);
      formData.append("description", description);
      if (logoFile) {
        formData.append("logo", logoFile);
      }
      formData.append("facebook", facebook);
      formData.append("twitter", twitter);

      const res = await fetch("/api/business/create", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to submit business");
      }

      // show confirmation then redirect
      setSuccess(true);
      setTimeout(() => {
        router.push("/business-directory");
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // If we’ve just succeeded, show a quick message
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-8">
        <div className="bg-gray-800 p-6 rounded-lg shadow text-center">
          <h2 className="text-2xl font-bold text-gold mb-4">
            🎉 Listing Submitted!
          </h2>
          <p className="text-gray-300 mb-6">
            Your business has been added to the directory.
          </p>
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
    <div className="bg-gray-900 text-white min-h-screen p-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-4xl font-bold text-gold">Add Your Business</h1>
      </header>

      <div className="max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
        {error && <p className="mb-4 text-red-400">⚠️ {error}</p>}

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          {/* Basic Information */}
          <fieldset className="mb-4">
            <legend className="text-xl font-bold text-gold">
              Basic Information
            </legend>
            <label className="block mt-2">
              Business Name:
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                className="w-full p-2 rounded bg-gray-700 text-white mt-1"
              />
            </label>
            <label className="block mt-2">
              Category:
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
            <label className="block mt-2">
              Location:
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, State, Country"
                required
                className="w-full p-2 rounded bg-gray-700 text-white mt-1"
              />
            </label>
          </fieldset>

          {/* Contact Information */}
          <fieldset className="mb-4">
            <legend className="text-xl font-bold text-gold">
              Contact Information
            </legend>
            <label className="block mt-2">
              Phone Number:
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full p-2 rounded bg-gray-700 text-white mt-1"
              />
            </label>
            <label className="block mt-2">
              Email Address:
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-2 rounded bg-gray-700 text-white mt-1"
              />
            </label>
            <label className="block mt-2">
              Website URL:
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 text-white mt-1"
              />
            </label>
          </fieldset>

          {/* Business Profile */}
          <fieldset className="mb-4">
            <legend className="text-xl font-bold text-gold">
              Business Profile
            </legend>
            <label className="block mt-2">
              Description:
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                required
                className="w-full p-2 rounded bg-gray-700 text-white mt-1"
              />
            </label>
          </fieldset>

          {/* Visual Assets */}
          <fieldset className="mb-4">
            <legend className="text-xl font-bold text-gold">Logo Upload</legend>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setLogoFile(e.target.files ? e.target.files[0] : null)
              }
              className="w-full p-2 rounded bg-gray-700 text-white mt-1"
            />
          </fieldset>

          {/* Social Media */}
          <fieldset className="mb-4">
            <legend className="text-xl font-bold text-gold">
              Social Media
            </legend>
            <label className="block mt-2">
              Facebook:
              <input
                type="url"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 text-white mt-1"
              />
            </label>
            <label className="block mt-2">
              Twitter:
              <input
                type="url"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
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
