// pages/job/[id]/apply.tsx
"use client";
import { useRouter } from "next/router";
import { useState } from "react";

interface Form {
  name: string;
  email: string;
  resume: string;
}

export default function JobApply() {
  const router = useRouter();
  const { query } = router;
  const [form, setForm] = useState<Form>({ name: "", email: "", resume: "" });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const res = await fetch(`/api/jobs/${query.id}/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      alert("Application sent!");
      router.back();
    } else {
      alert("Failed to submit application.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="relative bg-gray-800 text-white rounded-lg shadow-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={() => router.back()}
          className="absolute top-3 right-3 text-gray-400 hover:text-white text-xl"
          aria-label="Close"
        >
          &times;
        </button>

        <h1 className="text-2xl font-bold text-gold mb-4">Apply for this Job</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name (required) */}
          <label className="block">
            <span className="text-gray-300">
              Full Name <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setForm({ ...form, name: e.target.value })
              }
              className="mt-1 w-full px-3 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </label>

          {/* Email Address (required) */}
          <label className="block">
            <span className="text-gray-300">
              Email Address <span className="text-red-500">*</span>
            </span>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setForm({ ...form, email: e.target.value })
              }
              className="mt-1 w-full px-3 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </label>

          {/* Resume (optional) */}
          <label className="block">
            <span className="text-gray-300">Resume (URL or Text)</span>
            <textarea
              name="resume"
              value={form.resume}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setForm({ ...form, resume: e.target.value })
              }
              className="mt-1 w-full px-3 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-gold"
              rows={4}
            />
          </label>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-gold text-black font-semibold rounded hover:bg-yellow-500 transition"
          >
            Send Application
          </button>
        </form>
      </div>
    </div>
  );
}
