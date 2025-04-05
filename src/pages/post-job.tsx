import React, { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import BuyNowButton from "@/components/BuyNowButton";

const PostJob = () => {
  const { data: session } = useSession();
  const userId = session?.user?.id || "guest";

  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    type: "",
    description: "",
    salary: "",
    contactEmail: "",
  });

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const res = await fetch("/api/jobs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to post job");

      setSuccess(true);
      setFormData({
        title: "",
        company: "",
        location: "",
        type: "",
        description: "",
        salary: "",
        contactEmail: "",
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Job posting error:", err.message);
        setError(err.message);
      } else {
        console.error("Unexpected error:", err);
        setError("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-5xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-gold mb-4">Post a Job</h1>
        <p className="text-gray-400 mb-6">
          Add new opportunities and connect with Black professionals looking for
          work.
        </p>

        {/* Monetization Options */}
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          <div className="bg-gray-900 p-4 rounded shadow text-center">
            <h3 className="text-lg font-bold text-gold">Free Post</h3>
            <p className="text-sm text-gray-400">
              Basic listing, 1 per account
            </p>
            <p className="font-semibold mt-2">$0</p>
          </div>
          <div className="bg-gray-900 p-4 rounded shadow text-center">
            <h3 className="text-lg font-bold text-gold">Standard Post</h3>
            <p className="text-sm text-gray-400">
              30-day listing, enhanced visibility
            </p>
            <p className="font-semibold mt-2">$29.99</p>
            <BuyNowButton
              itemId="job-standard-post"
              amount={2999}
              type="job"
              label="Buy Standard"
              userId={userId}
            />
          </div>
          <div className="bg-gray-900 p-4 rounded shadow text-center">
            <h3 className="text-lg font-bold text-gold">Featured Post</h3>
            <p className="text-sm text-gray-400">
              Homepage promo, pinned, bold style
            </p>
            <p className="font-semibold mt-2">$79.99</p>
            <BuyNowButton
              itemId="job-featured-post"
              amount={7999}
              type="job"
              label="Buy Featured"
              userId={userId}
            />
          </div>
        </div>

        {success && (
          <p className="text-green-500 mb-4">✅ Job posted successfully!</p>
        )}
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="title"
            placeholder="Job Title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full p-3 rounded bg-gray-700 border border-gray-600"
          />

          <input
            type="text"
            name="company"
            placeholder="Company Name"
            value={formData.company}
            onChange={handleChange}
            required
            className="w-full p-3 rounded bg-gray-700 border border-gray-600"
          />

          <input
            type="text"
            name="location"
            placeholder="Location (Remote, City/State)"
            value={formData.location}
            onChange={handleChange}
            required
            className="w-full p-3 rounded bg-gray-700 border border-gray-600"
          />

          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
            className="w-full p-3 rounded bg-gray-700 border border-gray-600"
          >
            <option value="">Select Job Type</option>
            <option value="Full-Time">Full-Time</option>
            <option value="Part-Time">Part-Time</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
            <option value="Freelance">Freelance</option>
          </select>

          <textarea
            name="description"
            placeholder="Job Description"
            value={formData.description}
            onChange={handleChange}
            rows={6}
            required
            className="w-full p-3 rounded bg-gray-700 border border-gray-600"
          />

          <input
            type="text"
            name="salary"
            placeholder="Salary (optional)"
            value={formData.salary}
            onChange={handleChange}
            className="w-full p-3 rounded bg-gray-700 border border-gray-600"
          />

          <input
            type="email"
            name="contactEmail"
            placeholder="Contact Email"
            value={formData.contactEmail}
            onChange={handleChange}
            required
            className="w-full p-3 rounded bg-gray-700 border border-gray-600"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gold text-black font-semibold rounded hover:bg-yellow-500 transition"
          >
            {loading ? "Posting..." : "Post Free Job"}
          </button>
        </form>

        <div className="text-center mt-6">
          <Link
            href="/dashboard/employer"
            className="text-blue-500 hover:underline"
          >
            ← Back to Employer Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PostJob;
