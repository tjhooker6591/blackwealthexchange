import React from "react";
import Link from "next/link";

export default function AddBusiness() {
  return (
    <div className="bg-gray-900 text-white min-h-screen p-8">
      {/* Top Navigation */}
      <header className="mb-6">
        <Link href="/">
          <button className="px-4 py-2 bg-gold text-black font-bold rounded hover:bg-yellow-500 transition">
            Home
          </button>
        </Link>
        <h1 className="text-4xl font-bold text-gold mt-4">Add Your Business</h1>
      </header>

      <div className="max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
        <form id="add-business-form">
          {/* Basic Information */}
          <fieldset className="mb-4">
            <legend className="text-xl font-bold text-gold">
              Basic Information
            </legend>
            <label className="block mt-2">
              Business Name:
              <input
                type="text"
                name="businessName"
                required
                className="w-full p-2 rounded bg-gray-700 text-white mt-1"
              />
            </label>
            <label className="block mt-2">
              Business Type/Category:
              <select
                name="category"
                required
                className="w-full p-2 rounded bg-gray-700 text-white mt-1"
              >
                <option value="">Select Category</option>
                <option value="tech">Tech</option>
                <option value="beauty">Beauty</option>
                <option value="food">Food</option>
                <option value="fashion">Fashion</option>
                {/* Add more categories as needed */}
              </select>
            </label>
            <label className="block mt-2">
              Location:
              <input
                type="text"
                name="location"
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
                name="phone"
                required
                className="w-full p-2 rounded bg-gray-700 text-white mt-1"
              />
            </label>
            <label className="block mt-2">
              Email Address:
              <input
                type="email"
                name="email"
                required
                className="w-full p-2 rounded bg-gray-700 text-white mt-1"
              />
            </label>
            <label className="block mt-2">
              Website URL:
              <input
                type="url"
                name="website"
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
              Business Description:
              <textarea
                name="description"
                rows={5}
                required
                className="w-full p-2 rounded bg-gray-700 text-white mt-1"
              ></textarea>
            </label>
          </fieldset>

          {/* Visual Assets */}
          <fieldset className="mb-4">
            <legend className="text-xl font-bold text-gold">
              Visual Assets
            </legend>
            <label className="block mt-2">
              Business Logo:
              <input
                type="file"
                name="logo"
                accept="image/*"
                className="w-full p-2 rounded bg-gray-700 text-white mt-1"
              />
            </label>
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
                name="facebook"
                className="w-full p-2 rounded bg-gray-700 text-white mt-1"
              />
            </label>
            <label className="block mt-2">
              Twitter:
              <input
                type="url"
                name="twitter"
                className="w-full p-2 rounded bg-gray-700 text-white mt-1"
              />
            </label>
          </fieldset>

          <button
            type="submit"
            className="w-full p-4 bg-gold text-black font-bold rounded hover:bg-yellow-500 transition"
          >
            Submit Business
          </button>
        </form>
      </div>
    </div>
  );
}
