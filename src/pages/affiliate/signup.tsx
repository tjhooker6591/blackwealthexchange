// src/pages/affiliate/signup.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AffiliateSignup() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    website: "",
    audienceSize: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) {
          setIsLoggedIn(false);
          return;
        }
        const data = await res.json();
        if (!data.user) {
          setIsLoggedIn(false);
        }
      } catch {
        setIsLoggedIn(false);
      }
    };
    checkSession();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm({ ...form, [e.target.name]: e.target.value });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const res = await fetch("/api/affiliate/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setSuccess(true);
    } else {
      alert("Something went wrong, try again.");
    }

    setSubmitting(false);
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center space-y-6">
        <h1 className="text-3xl font-bold text-gold">Please Log In</h1>
        <p>You must be logged in to apply for the Affiliate Program.</p>
        <button
          onClick={() => router.push("/login")}
          className="px-6 py-3 bg-gold text-black font-semibold rounded hover:bg-yellow-500 transition"
        >
          Go to Login
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center space-y-6">
        <h1 className="text-4xl font-bold text-gold">Application Received!</h1>
        <p>We’ll review it and email you within 3 business days.</p>
        <button
          onClick={() => router.push("/affiliate")}
          className="px-6 py-3 bg-gold text-black font-semibold rounded hover:bg-yellow-500 transition"
        >
          Back to Affiliate Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg mx-auto p-8 bg-gray-900 rounded-xl shadow-lg space-y-6"
      >
        <h1 className="text-3xl font-extrabold text-gold text-center">
          Affiliate Application
        </h1>

        {['name', 'website', 'audienceSize'].map((field) => (
          <input
            key={field}
            name={field}
            type="text"
            placeholder={
              field === "audienceSize"
                ? "Audience size / Reach"
                : `Your ${field.charAt(0).toUpperCase() + field.slice(1)}`
            }
            value={(form as any)[field]}
            onChange={handleChange}
            className="w-full p-3 rounded bg-gray-800 text-white placeholder-gray-500 focus:ring-2 focus:ring-gold outline-none"
            required
          />
        ))}

        <textarea
          name="notes"
          placeholder="Tell us about your audience, content niche, or goals…"
          value={form.notes}
          onChange={handleChange}
          rows={4}
          className="w-full p-3 rounded bg-gray-800 text-white placeholder-gray-500 focus:ring-2 focus:ring-gold outline-none"
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-gold text-black font-semibold rounded hover:bg-yellow-500 transition disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Apply Now"}
        </button>
      </form>
    </div>
  );
}
