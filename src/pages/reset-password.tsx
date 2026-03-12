// src/pages/reset-password.tsx
"use client";

import Link from "next/link";
import Head from "next/head";
import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import { canonicalUrl } from "@/lib/seo";

export default function ResetPasswordPage() {
  const router = useRouter();
  const token =
    typeof router.query.token === "string" ? router.query.token : "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordTooShort = useMemo(() => {
    return password.length > 0 && password.length < 8;
  }, [password]);

  const passwordsDoNotMatch = useMemo(() => {
    return confirmPassword.length > 0 && password !== confirmPassword;
  }, [password, confirmPassword]);

  const canSubmit =
    !loading &&
    !!token &&
    password.length >= 8 &&
    confirmPassword.length >= 8 &&
    password === confirmPassword;

  const handleReset = async () => {
    setError("");

    if (!token) {
      setError("Invalid or missing reset token.");
      return;
    }

    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const text = await res.text();
      const data = text
        ? (() => {
            try {
              return JSON.parse(text);
            } catch {
              return null;
            }
          })()
        : null;

      if (!res.ok) {
        throw new Error(
          data?.error || data?.message || "Error resetting password",
        );
      }

      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
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

  const canonical = canonicalUrl("/reset-password");

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-6">
      <Head>
        <title>Reset Password | Black Wealth Exchange</title>
        <meta name="robots" content="noindex,nofollow" />
        <link rel="canonical" href={canonical} />
      </Head>
      {/* subtle glow */}
      <div className="pointer-events-none fixed inset-0 opacity-40">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full blur-3xl bg-yellow-500/20" />
        <div className="absolute top-24 right-[-120px] h-[420px] w-[420px] rounded-full blur-3xl bg-yellow-400/10" />
      </div>

      <div className="relative w-full max-w-md bg-gray-900/80 border border-yellow-400/30 p-6 rounded-2xl shadow-xl backdrop-blur">
        <h1 className="text-2xl font-bold text-yellow-400 mb-2">
          Reset Your Password
        </h1>
        <p className="text-sm text-gray-400 mb-6">
          Enter a new password for your account.
        </p>

        {success ? (
          <div className="space-y-4">
            <p className="text-green-400 text-sm">
              ✅ Password reset successful. You can now log in with your new
              password.
            </p>

            <Link
              href="/login"
              className="inline-flex items-center rounded-lg bg-yellow-400 px-4 py-2 font-semibold text-black hover:bg-yellow-300 transition"
            >
              Go to Login
            </Link>
          </div>
        ) : (
          <>
            {!token && (
              <p className="text-red-400 mb-4 text-sm">
                Invalid or missing reset token.
              </p>
            )}

            {error && <p className="text-red-400 mb-4 text-sm">{error}</p>}

            <div className="mb-4">
              <label className="block text-sm mb-1 text-gray-200">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 rounded-lg bg-gray-950 border border-gray-800 outline-none focus:border-yellow-400/60"
                placeholder="Enter new password"
                autoComplete="new-password"
              />
              {passwordTooShort && (
                <p className="text-xs text-red-400 mt-1">
                  Password must be at least 8 characters.
                </p>
              )}
            </div>

            <div className="mb-5">
              <label className="block text-sm mb-1 text-gray-200">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 rounded-lg bg-gray-950 border border-gray-800 outline-none focus:border-yellow-400/60"
                placeholder="Confirm new password"
                autoComplete="new-password"
              />
              {passwordsDoNotMatch && (
                <p className="text-xs text-red-400 mt-1">
                  Passwords do not match.
                </p>
              )}
            </div>

            <button
              onClick={handleReset}
              disabled={!canSubmit}
              className={[
                "w-full py-3 px-4 rounded-lg font-semibold transition",
                !canSubmit
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-yellow-400 text-black hover:bg-yellow-300",
              ].join(" ")}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <div className="flex items-center justify-between pt-3">
              <Link
                href="/login"
                className="text-sm text-yellow-400 hover:underline"
              >
                ← Back to Login
              </Link>

              <Link
                href="/forgot-password"
                className="text-sm text-gray-300 hover:underline"
              >
                Request new link
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
