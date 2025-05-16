"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function Signup() {
  const router = useRouter();
  const [accountType, setAccountType] = useState("user");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    businessName: "",
    businessAddress: "",
    businessPhone: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);

  // Redirect immediately when onboardingUrl is set
  useEffect(() => {
    if (onboardingUrl) {
      // Optionally show a toast or loader before redirect
      window.location.assign(onboardingUrl);
    }
  }, [onboardingUrl]);

  useEffect(() => {
    const { type } = router.query;
    if (type && typeof type === "string") {
      setAccountType(type);
    }
  }, [router.query]);

  const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email);
  const validatePassword = (password: string) =>
    /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleAccountTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAccountType(e.target.value);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validations
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError("All fields are required.");
      return;
    }
    if (!validateEmail(formData.email)) {
      setError("Invalid email format.");
      return;
    }
    if (!validatePassword(formData.password)) {
      setError(
        "Password must be at least 8 characters, include 1 uppercase letter, 1 number, and 1 special character."
      );
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          accountType,
          businessName: formData.businessName,
          businessAddress: formData.businessAddress,
          businessPhone: formData.businessPhone,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Signup failed.");
      }

      // If seller, trigger redirect via onboardingUrl state
      if (data.accountType === 'seller') {
        if (data.stripeOnboardingLink) {
          setOnboardingUrl(data.stripeOnboardingLink);
        } else {
          setError("Signup succeeded but Stripe onboarding link was not provided. Please try again.");
        }
        return;
      }

      setSuccess(true);
      setFormData({
        email: "",
        password: "",
        confirmPassword: "",
        businessName: "",
        businessAddress: "",
        businessPhone: "",
      });

      // Delay redirect to allow cookies to register
      setTimeout(() => {
        switch (data.accountType) {
          case "business":
            router.push("/add-business");
            break;
          case "employer":
            router.push("/employer/jobs");
            break;
          default:
            router.push("/dashboard");
            break;
        }
      }, 500);
    } catch (err) {
      console.error("Signup error:", err);
      setError("Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-100 p-6">
      <div className="bg-white p-8 shadow-lg rounded-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gold">
          Create an Account
        </h2>
        <p className="text-center text-gray-600 mt-2">Join the BWE Community</p>

        {error && <p className="text-red-500 text-center mt-2">{error}</p>}
        {success && !onboardingUrl && (
          <p className="text-green-500 text-center mt-2">
            Signup Successful! 🎉
          </p>
        )}
        {/* Fallback message and link if auto-redirect fails */}
        {onboardingUrl && (
          <p className="mt-4 text-center">
            Redirecting you to Stripe to complete your setup.
            If you are not redirected automatically,{' '}
            <a
              href={onboardingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ggold underline"
            >
              click here
            </a>.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Form fields unchanged */}
          <div>
            <label className="block text-gray-700 font-semibold">
              Account Type
            </label>
            <select
              name="accountType"
              value={accountType}
              onChange={handleAccountTypeChange}
              className="w-full p-3 border rounded-lg bg-gray-200 text-black"
            >
              <option value="user">General User</option>
              <option value="seller">Seller</option>
              <option value="business">Business Owner</option>
              <option value="employer">Employer</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold">Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg bg-gray-200 text-black"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold">
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg bg-gray-200 text-black"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg bg-gray-200 text-black"
              required
            />
          </div>

          {accountType === "business" && (
            <>
              <div>
                <label className="block text-gray-700 font-semibold">
                  Business Name
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg bg-gray-200 text-black"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold">
                  Business Address
                </label>
                <input
                  type="text"
                  name="businessAddress"
                  value={formData.businessAddress}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg bg-gray-200 text-black"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold">
                  Business Phone
                </label>
                <input
                  type="text"
                  name="businessPhone"
                  value={formData.businessPhone}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg bg-gray-200 text-black"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gold text-black font-semibold rounded-lg hover:bg-opacity-90 transition"
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center mt-4 text-gray-600">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-gold font-semibold hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
