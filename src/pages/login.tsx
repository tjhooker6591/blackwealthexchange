// src/pages/login.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function Login() {
  const router = useRouter();
  const { accountType: queryType } = router.query as { accountType?: string };

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    accountType: "user",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 1) If already logged in, send to dashboard immediately
  useEffect(() => {
    fetch("/api/auth/me", {
      cache: "no-store",
      credentials: "include",
    })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Not authenticated");
      })
      .then(({ user }) => {
        if (user?.accountType) {
          switch (user.accountType) {
            case "seller":
              router.replace("/marketplace/dashboard");
              break;
            case "business":
              router.replace("/dashboard");
              break;
            case "employer":
              router.replace("/employer");
              break;
            default:
              router.replace("/dashboard");
          }
        }
      })
      .catch(() => {
        // not logged in, stay on login page
      });
  }, [router]);

  // 2) Pre‑select accountType from query string if present
  useEffect(() => {
    if (
      queryType === "user" ||
      queryType === "seller" ||
      queryType === "business" ||
      queryType === "employer"
    ) {
      setFormData((f) => ({ ...f, accountType: queryType }));
    }
  }, [queryType]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { email, password, accountType } = formData;

    if (!email || !password || !accountType) {
      setError("All fields are required.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Invalid email format.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Login failed.");
      }

      // 3) Redirect based on role
      switch (data.user.accountType) {
        case "seller":
          router.push("/marketplace/dashboard");
          break;
        case "business":
          router.push("/dashboard");
          break;
        case "employer":
          router.push("/employer");
          break;
        default:
          router.push("/dashboard");
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-100 px-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gold">
          Welcome Back
        </h2>
        <p className="text-center text-gray-600 mt-2">Login to your account</p>

        {error && <p className="text-red-500 text-center mt-2">{error}</p>}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Account Type */}
          <div>
            <label className="block text-gray-700 font-semibold">
              Account Type
            </label>
            <select
              name="accountType"
              value={formData.accountType}
              onChange={handleChange}
              className="w-full p-3 border rounded bg-gray-200 text-black"
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
            <label className="block text-gray-700 font-semibold">Email</label>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 border rounded bg-gray-200 text-black"
              required
            />
          </div>

          {/* Password */}
          <div className="relative">
            <label className="block text-gray-700 font-semibold">
              Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-3 border rounded bg-gray-200 text-black pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-[38px] text-gray-500"
            >
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 bg-gold text-black font-semibold rounded-lg ${
              loading ? "opacity-50 cursor-not-allowed" : "hover:bg-yellow-500"
            } transition`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center mt-4">
          <Link href="/reset-password" className="text-red-500 hover:underline">
            Forgot Password?
          </Link>
        </p>
        <p className="text-center mt-4">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-gold font-semibold hover:underline"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
