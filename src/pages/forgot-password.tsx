// src/pages/forgot-password.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // Always show generic success to avoid account enumeration
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const emailTrimmed = email.trim();

  const isEmailValid = useMemo(() => {
    if (!emailTrimmed) return false;
    // Simple, practical validation
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed);
  }, [emailTrimmed]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmailValid || loading) return;

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailTrimmed }),
      });

      // Some APIs return empty body on success/failure
      const text = await res.text();
      const data = text ? (() => { try { return JSON.parse(text); } catch { return null; } })() : null;

      // IMPORTANT: Do not reveal whether the email exists
      if (!res.ok) {
        // If you want to log server message, you can console.error it, but do not show it to user.
        console.error("Forgot password error:", data?.message || text || res.status);
      }

      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-6">
      {/* subtle glow */}
      <div className="pointer-events-none fixed inset-0 opacity-40">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full blur-3xl bg-yellow-500/20" />
        <div className="absolute top-24 right-[-120px] h-[420px] w-[420px] rounded-full blur-3xl bg-yellow-400/10" />
      </div>

      <div className="relative w-full max-w-md bg-gray-900/80 border border-yellow-400/30 p-6 rounded-2xl shadow-xl backdrop-blur">
        <h1 className="text-2xl font-bold text-yellow-400 mb-2">
          Forgot Password
        </h1>
        <p className="text-sm text-gray-400 mb-6">
          Enter your email and we’ll send a reset link if an account exists.
        </p>

        {success && (
          <p className="text-green-400 mb-4 text-sm">
            ✅ If an account exists for that email, a reset link has been sent.
          </p>
        )}

        {error && <p className="text-red-400 mb-4 text-sm">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-gray-200">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-950 border border-gray-800 outline-none focus:border-yellow-400/60"
              placeholder="e.g. you@example.com"
              autoComplete="email"
              inputMode="email"
            />
            {emailTrimmed && !isEmailValid && (
              <p className="text-xs text-red-400 mt-1">
                Please enter a valid email address.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!isEmailValid || loading}
            className={[
              "w-full py-3 px-4 rounded-lg font-semibold transition",
              !isEmailValid || loading
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-yellow-400 text-black hover:bg-yellow-300",
            ].join(" ")}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>

          <div className="flex items-center justify-between pt-2">
            <Link href="/login" className="text-sm text-yellow-400 hover:underline">
              ← Back to Login
            </Link>

            <Link href="/signup" className="text-sm text-gray-300 hover:underline">
              Create account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
