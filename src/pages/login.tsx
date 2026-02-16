// src/pages/login.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

type AccountType = "user" | "seller" | "business" | "employer";

function safeParseJSON(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function isAllowedAccountType(v?: string): v is AccountType {
  return v === "user" || v === "seller" || v === "business" || v === "employer";
}

export default function Login() {
  const router = useRouter();

  const queryAccountType = (router.query.accountType as string | undefined) || undefined;
  const redirect =
    (router.query.redirect as string | undefined) ||
    (router.query.next as string | undefined) ||
    "";

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    accountType: "user" as AccountType,
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const emailTrimmed = formData.email.trim();

  const redirectTarget = useMemo(() => {
    // basic sanitization: only allow internal paths
    if (!redirect) return "";
    if (redirect.startsWith("/") && !redirect.startsWith("//")) return redirect;
    return "";
  }, [redirect]);

  const defaultRouteForRole = (role: AccountType) => {
    switch (role) {
      case "seller":
        return "/marketplace/dashboard";
      case "employer":
        return "/employer";
      case "business":
        return "/dashboard";
      default:
        return "/dashboard";
    }
  };

  // Preselect accountType from query string (keeps your behavior)
  useEffect(() => {
    if (!router.isReady) return;
    if (isAllowedAccountType(queryAccountType)) {
      setFormData((f) => ({ ...f, accountType: queryAccountType }));
    }
  }, [router.isReady, queryAccountType]);

  // If already logged in, redirect immediately (respect redirect param)
  useEffect(() => {
    if (!router.isReady) return;

    fetch("/api/auth/me", { cache: "no-store", credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then(({ user }) => {
        if (!user?.accountType) return;

        // If a redirect target is provided, honor it for any role
        if (redirectTarget) {
          router.replace(redirectTarget);
          return;
        }

        // Otherwise default by role
        router.replace(defaultRouteForRole(user.accountType));
      })
      .catch(() => {
        // not logged in, stay here
      });
  }, [router.isReady, router, redirectTarget]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { password, accountType } = formData;

    if (!emailTrimmed || !password || !accountType) {
      setError("All fields are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      setError("Invalid email format.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, email: emailTrimmed }),
      });

      const text = await res.text();
      const data = text ? safeParseJSON(text) : null;

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Login failed.");
      }

      const role = data?.user?.accountType as AccountType | undefined;

      // Respect redirect params first
      if (redirectTarget) {
        router.push(redirectTarget);
        return;
      }

      // Fall back to role-based routes
      router.push(role ? defaultRouteForRole(role) : "/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 py-10 text-white">
      {/* subtle glow */}
      <div className="pointer-events-none fixed inset-0 opacity-40">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full blur-3xl bg-yellow-500/20" />
        <div className="absolute top-24 right-[-120px] h-[420px] w-[420px] rounded-full blur-3xl bg-yellow-400/10" />
      </div>

      <div className="relative w-full max-w-md bg-gray-900/80 border border-yellow-400/30 p-8 rounded-2xl shadow-xl backdrop-blur">
        <h2 className="text-3xl font-extrabold text-center text-yellow-400">
          Welcome Back
        </h2>
        <p className="text-center text-gray-300 mt-2">Login to your account</p>

        {redirectTarget ? (
          <p className="text-xs text-gray-400 text-center mt-2">
            You’ll be redirected to <span className="text-gray-200">{redirectTarget}</span> after login.
          </p>
        ) : null}

        {error && <p className="text-red-400 text-center mt-3">{error}</p>}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Account Type */}
          <div>
            <label className="block text-sm text-gray-200 font-semibold">Account Type</label>
            <select
              name="accountType"
              value={formData.accountType}
              onChange={handleChange}
              className="mt-1 w-full p-3 rounded-lg bg-gray-950 border border-gray-800 text-white outline-none focus:border-yellow-400/60"
              required
            >
              <option value="user">General User</option>
              <option value="seller">Seller</option>
              <option value="business">Business Owner</option>
              <option value="employer">Employer</option>
            </select>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm text-gray-200 font-semibold">Email</label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 w-full p-3 rounded-lg bg-gray-950 border border-gray-800 text-white outline-none focus:border-yellow-400/60"
              autoComplete="email"
              required
            />
          </div>

          {/* Password */}
          <div className="relative">
            <label className="block text-sm text-gray-200 font-semibold">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className="mt-1 w-full p-3 rounded-lg bg-gray-950 border border-gray-800 text-white outline-none focus:border-yellow-400/60 pr-10"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-[38px] text-gray-400 hover:text-white"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={[
              "w-full py-3 rounded-lg font-semibold transition",
              loading
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-yellow-400 text-black hover:bg-yellow-300",
            ].join(" ")}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between">
          <Link href="/forgot-password" className="text-sm text-yellow-400 hover:underline">
            Forgot Password?
          </Link>

          <Link href="/signup" className="text-sm text-gray-200 hover:underline">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
