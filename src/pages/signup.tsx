"use client";

import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";

type AccountType = "user" | "seller" | "business" | "employer";

type BenefitItem = {
  title: string;
  body: string;
};

type RoleItem = {
  label: string;
  description: string;
};

type NextStep = {
  title: string;
  body: string;
};

const roleLabels: Record<AccountType, string> = {
  user: "Supporter",
  business: "Business Owner",
  seller: "Seller",
  employer: "Employer",
};

const benefitItems: BenefitItem[] = [
  {
    title: "Discover and support Black-owned businesses",
    body: "Explore a platform built to help Black dollars circulate with intention.",
  },
  {
    title: "Save the opportunities that matter to you",
    body: "Keep businesses, jobs, products, and resources within reach as member tools grow.",
  },
  {
    title: "Join a mission-driven platform",
    body: "Be part of a polished ecosystem focused on visibility, ownership, and economic empowerment.",
  },
  {
    title: "Grow your visibility if you build or hire",
    body: "Business owners, sellers, and employers can use BWE to expand reach and manage key next steps.",
  },
];

const roleItems: RoleItem[] = [
  {
    label: "Supporters",
    description: "Discover businesses, save opportunities, and move your spending with purpose.",
  },
  {
    label: "Business owners",
    description: "Join the ecosystem, strengthen visibility, and prepare to manage your presence as tools expand.",
  },
  {
    label: "Sellers",
    description: "Create your account and continue into seller setup when you are ready to grow through the marketplace.",
  },
  {
    label: "Employers",
    description: "Access hiring tools and job visibility designed to connect talent with opportunity.",
  },
];

const nextStepsByRole: Record<AccountType, NextStep[]> = {
  user: [
    {
      title: "Explore the directory",
      body: "Start discovering Black-owned businesses, resources, and opportunities across the platform.",
    },
    {
      title: "Save what matters",
      body: "Use your account to keep track of businesses, products, jobs, and tools as member features grow.",
    },
    {
      title: "Access your dashboard",
      body: "Return to one place to manage your activity and stay connected to the mission.",
    },
  ],
  business: [
    {
      title: "Access your dashboard",
      body: "Create your secure account and move into your BWE dashboard experience.",
    },
    {
      title: "List or manage your business",
      body: "Continue into business-related flows so your presence can grow with the platform.",
    },
    {
      title: "Stay visible to the community",
      body: "Use BWE to strengthen discovery, trust, and long-term reach.",
    },
  ],
  seller: [
    {
      title: "Complete your seller path",
      body: "After signup, continue into seller onboarding so you can prepare your marketplace presence.",
    },
    {
      title: "Access your tools",
      body: "Use your account to manage products, visibility, and future member benefits.",
    },
    {
      title: "Grow with BWE",
      body: "Sell within a platform built to support Black entrepreneurship and circulation of buying power.",
    },
  ],
  employer: [
    {
      title: "Access employer tools",
      body: "After signup, head into employer workflows designed for job posting and hiring visibility.",
    },
    {
      title: "Share opportunities",
      body: "Use BWE to connect your roles with a community-centered audience.",
    },
    {
      title: "Manage from your dashboard",
      body: "Keep your hiring activity organized in one secure place.",
    },
  ],
};

const accountTypeDescriptions: Record<AccountType, string> = {
  user: "For supporters who want to discover businesses, save resources, and stay connected to the mission.",
  business:
    "For business owners who want an account they can use to grow visibility and manage their BWE presence.",
  seller:
    "For sellers who plan to continue into marketplace onboarding and start building their storefront path.",
  employer:
    "For employers who want access to job and hiring tools within the BWE ecosystem.",
};

const accountTypeCta: Record<AccountType, string> = {
  user: "Join BWE",
  business: "Join as a Business Owner",
  seller: "Join as a Seller",
  employer: "Join as an Employer",
};

export default function Signup() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<AccountType>("user");

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

  const isTrustedStripeOnboardingUrl = (candidate: string) => {
    try {
      const parsed = new URL(candidate);
      return (
        parsed.protocol === "https:" &&
        (parsed.hostname === "connect.stripe.com" ||
          parsed.hostname.endsWith(".stripe.com"))
      );
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (onboardingUrl) {
      window.location.assign(onboardingUrl);
    }
  }, [onboardingUrl]);

  useEffect(() => {
    const { type } = router.query;
    if (
      type &&
      typeof type === "string" &&
      ["user", "seller", "business", "employer"].includes(type)
    ) {
      setAccountType(type as AccountType);
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
    setAccountType(e.target.value as AccountType);
    setError("");
  };

  const selectedNextSteps = useMemo(
    () => nextStepsByRole[accountType],
    [accountType],
  );

  const selectedRoleLabel = roleLabels[accountType];
  const selectedAccountDescription = accountTypeDescriptions[accountType];
  const selectedCta = accountTypeCta[accountType];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
        "Password must be at least 8 characters, include 1 uppercase letter, 1 number, and 1 special character.",
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

      if (data.accountType === "seller") {
        if (data.stripeOnboardingLink) {
          if (!isTrustedStripeOnboardingUrl(data.stripeOnboardingLink)) {
            throw new Error("Unexpected onboarding destination. Please retry.");
          }

          setOnboardingUrl(data.stripeOnboardingLink);
          return;
        }

        setSuccess(true);
        setTimeout(() => {
          router.push("/marketplace/become-a-seller");
        }, 500);
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
      const message =
        err instanceof Error ? err.message : "Signup failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Join Black Wealth Exchange | Build, Buy, Belong</title>
        <meta
          name="description"
          content="Join Black Wealth Exchange to discover Black-owned businesses, support the mission, save opportunities, and access member tools as the platform grows."
        />
        <meta name="robots" content="noindex,nofollow" />
        <link
          rel="canonical"
          href="https://www.blackwealthexchange.com/signup"
        />
        <meta
          property="og:title"
          content="Join Black Wealth Exchange | Build, Buy, Belong"
        />
        <meta
          property="og:description"
          content="Create your Black Wealth Exchange account to discover, support, and grow within a platform built to circulate Black buying power."
        />
      </Head>
      <div className="min-h-screen bg-[#050505] px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-10">
          <section className="relative overflow-hidden rounded-[28px] border border-yellow-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.16),_transparent_36%),linear-gradient(180deg,rgba(17,17,17,0.98),rgba(8,8,8,0.98))] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:p-8 lg:p-10">
            <div className="absolute inset-0 opacity-40">
              <div className="absolute left-[-60px] top-[-40px] h-48 w-48 rounded-full bg-yellow-400/20 blur-3xl" />
              <div className="absolute bottom-[-80px] right-[-30px] h-56 w-56 rounded-full bg-amber-500/10 blur-3xl" />
            </div>
            <div className="relative">
              <div className="inline-flex items-center rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-yellow-300">
                Join BWE
              </div>

              <h1 className="mt-5 max-w-2xl text-4xl font-black tracking-tight text-white sm:text-5xl">
                Join the platform built to discover, support, and grow Black economic power.
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-gray-200 sm:text-lg">
                Create your BWE account to find Black-owned businesses, support the mission, save the opportunities you care about, and access member tools as the ecosystem expands.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {benefitItems.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
                  >
                    <h2 className="text-sm font-bold text-yellow-300">
                      {item.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-gray-300">
                      {item.body}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-2xl border border-yellow-400/20 bg-black/30 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Built for every part of the BWE ecosystem
                    </h2>
                    <p className="mt-1 text-sm text-gray-300">
                      One account experience, with role-aware paths for how you show up.
                    </p>
                  </div>
                  <div className="rounded-full border border-yellow-400/25 bg-yellow-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-yellow-300">
                    {selectedRoleLabel} path selected
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {roleItems.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-white/10 bg-white/5 p-4"
                    >
                      <h3 className="text-sm font-semibold text-white">
                        {item.label}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-gray-300">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-yellow-400/20 bg-white p-5 text-gray-900 shadow-[0_20px_70px_rgba(0,0,0,0.18)] sm:p-7 lg:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-yellow-700">
                  Start your account
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
                  Build your place inside BWE
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-gray-600 sm:text-base">
                  Choose the path that fits you now. You can join as a supporter, business owner, seller, or employer without a complicated setup process.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
              <p className="text-sm font-semibold text-gray-900">
                {selectedRoleLabel}
              </p>
              <p className="mt-1 text-sm leading-6 text-gray-700">
                {selectedAccountDescription}
              </p>
            </div>

            {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}
            {success && !onboardingUrl && (
              <p className="mt-4 text-center text-sm text-green-600">
                Signup successful. Taking you to your next step.
              </p>
            )}
            {onboardingUrl && (
              <p className="mt-4 text-center text-sm leading-6 text-gray-700">
                Redirecting you to Stripe to complete your setup. If you are not redirected automatically, {" "}
                <a
                  href={onboardingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-yellow-700 underline"
                >
                  click here
                </a>
                .
              </p>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800">
                  Account Type
                </label>
                <select
                  name="accountType"
                  value={accountType}
                  onChange={handleAccountTypeChange}
                  className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
                >
                  <option value="user">General User</option>
                  <option value="seller">Seller</option>
                  <option value="business">Business Owner</option>
                  <option value="employer">Employer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800">Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
                  autoComplete="new-password"
                  required
                />
                <p className="mt-2 text-xs leading-5 text-gray-500">
                  Use at least 8 characters, including 1 uppercase letter, 1 number, and 1 special character.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
                  autoComplete="new-password"
                  required
                />
              </div>

              {accountType === "business" && (
                <div className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">
                      Business details
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      These details help prepare your business-related experience after signup.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800">
                      Business Name
                    </label>
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800">
                      Business Address
                    </label>
                    <input
                      type="text"
                      name="businessAddress"
                      value={formData.businessAddress}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800">
                      Business Phone
                    </label>
                    <input
                      type="text"
                      name="businessPhone"
                      value={formData.businessPhone}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-xl bg-yellow-400 px-4 py-3.5 text-base font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:bg-yellow-200"
              >
                {loading ? "Creating your account..." : selectedCta}
              </button>
            </form>

            <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
              <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-gray-900">
                What happens next
              </h3>
              <div className="mt-4 space-y-3">
                {selectedNextSteps.map((step, index) => (
                  <div key={step.title} className="flex gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-sm font-bold text-black">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                      <p className="mt-1 text-sm leading-6 text-gray-600">{step.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-gray-200 p-4 sm:p-5">
              <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-gray-900">
                Secure and respectful by design
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Your account is protected through our secure signup flow. Need help? Visit the {" "}
                <Link href="/support" className="font-semibold text-yellow-700 hover:underline">
                  support center
                </Link>
                {" "}or log in anytime to manage your dashboard.
              </p>
            </div>

            <p className="mt-6 text-center text-sm text-gray-600">
              Already have an account? {" "}
              <Link href="/login" className="font-semibold text-yellow-700 hover:underline">
                Log in
              </Link>
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
