"use client";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import BuyNowButton from "@/components/BuyNowButton";

interface Job {
  _id?: string;
  userId?: string;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  salary?: string;
  [key: string]: unknown; // ✅ FIXED: Avoid `any` warning
}

export default function EditJobPage() {
  const router = useRouter();
  const { id } = router.query;
  const [job, setJob] = useState<Job | null>(null);
  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    type: "",
    description: "",
    salary: "",
  });
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [promotionDuration, setPromotionDuration] = useState<string>("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/jobs/get?id=${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.job) {
          setJob(data.job);
          setForm({
            title: data.job.title || "",
            company: data.job.company || "",
            location: data.job.location || "",
            type: data.job.type || "",
            description: data.job.description || "",
            salary: data.job.salary || "",
          });
        } else {
          setError("Job not found.");
        }
      })
      .catch(() => setError("Failed to fetch job."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSuccess(true);
      } else {
        setError("Failed to update job.");
      }
    } catch (err) {
      console.error(err);
      setError("Server error");
    }
  };

  const getPromoAmount = () => {
    switch (promotionDuration) {
      case "7":
        return 25;
      case "14":
        return 45;
      case "30":
        return 75;
      default:
        return 0;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto bg-gray-800 p-6 rounded-lg shadow">
        <h1 className="text-3xl font-bold text-gold mb-4">Edit Job</h1>

        {loading ? (
          <p className="text-gray-400">Loading job...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="title"
                placeholder="Job Title"
                value={form.title}
                onChange={handleChange}
                className="w-full p-3 rounded bg-gray-700 border border-gray-600"
                required
              />

              <input
                type="text"
                name="company"
                placeholder="Company Name"
                value={form.company}
                onChange={handleChange}
                className="w-full p-3 rounded bg-gray-700 border border-gray-600"
                required
              />

              <input
                type="text"
                name="location"
                placeholder="Location"
                value={form.location}
                onChange={handleChange}
                className="w-full p-3 rounded bg-gray-700 border border-gray-600"
                required
              />

              <input
                type="text"
                name="type"
                placeholder="Job Type"
                value={form.type}
                onChange={handleChange}
                className="w-full p-3 rounded bg-gray-700 border border-gray-600"
                required
              />

              <textarea
                name="description"
                placeholder="Job Description"
                value={form.description}
                onChange={handleChange}
                className="w-full p-3 rounded bg-gray-700 border border-gray-600"
                rows={5}
                required
              />

              <input
                type="text"
                name="salary"
                placeholder="Salary (optional)"
                value={form.salary}
                onChange={handleChange}
                className="w-full p-3 rounded bg-gray-700 border border-gray-600"
              />

              <button
                type="submit"
                className="w-full py-3 bg-gold text-black font-semibold rounded hover:bg-yellow-500 transition"
              >
                Update Job
              </button>

              {success && (
                <p className="text-green-500 mt-2">
                  ✅ Job updated successfully!
                </p>
              )}
            </form>

            {/* Promote Job Section */}
            <div className="mt-10 border-t border-gray-600 pt-6">
              <h2 className="text-xl font-bold text-gold mb-4">
                Promote This Job
              </h2>
              <p className="text-gray-300 mb-2">
                Select how long you&apos;d like your job featured:
              </p>
              <div className="flex gap-4 mb-4">
                {[
                  { label: "7 Days - $25", value: "7" },
                  { label: "14 Days - $45", value: "14" },
                  { label: "30 Days - $75", value: "30" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPromotionDuration(option.value)}
                    className={`px-4 py-2 rounded font-medium border ${
                      promotionDuration === option.value
                        ? "bg-gold text-black border-gold"
                        : "bg-gray-700 border-gray-600 text-white"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {promotionDuration && id && (
                <BuyNowButton
                  userId={(job?.userId as string) || "guest"}
                  itemId={`feature-job-${id}`}
                  amount={getPromoAmount()}
                  type="job"
                  label="Promote Now"
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
