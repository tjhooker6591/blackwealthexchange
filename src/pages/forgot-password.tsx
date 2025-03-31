"use client";

import { useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Something went wrong");

      setMessage("A password reset link has been sent to your email.");
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
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-6">
      <div className="w-full max-w-md bg-gray-900 border border-gold p-6 rounded-lg">
        <h1 className="text-2xl font-bold text-gold mb-4">Forgot Password</h1>
        <p className="text-sm text-gray-400 mb-6">
          Enter your email address and we&apos;ll send you a link to reset your
          password.
        </p>

        {message && <p className="text-green-500 mb-4 text-sm">{message}</p>}
        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

        <div className="mb-4">
          <label className="block text-sm mb-1">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 border border-gray-700"
            placeholder="e.g. you@example.com"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!email || loading}
          className={`w-full py-2 px-4 rounded text-black font-semibold transition ${
            email && !loading
              ? "bg-gold hover:bg-yellow-500"
              : "bg-gray-500 cursor-not-allowed"
          }`}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </div>
    </div>
  );
}
