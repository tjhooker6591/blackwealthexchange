// src/pages/post-job.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import BuyNowButton from "@/components/BuyNowButton";

type ListingTier = "free" | "standard" | "featured";

type MeUser = {
  _id?: string;
  id?: string; // fallback if your API uses id
  email?: string;
  accountType?: string;
};

type JobDraft = {
  formData: {
    title: string;
    company: string;
    location: string;
    type: string;
    description: string;
    salary: string;
    contactEmail: string;
  };
  tier: ListingTier;
  savedAt: number;
};

const DRAFT_KEY = "bwe_job_post_draft_v1";

const PostJob = () => {
  const router = useRouter();

  const [user, setUser] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);

  const [tier, setTier] = useState<ListingTier>("free");

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [draftSaved, setDraftSaved] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    type: "Full-Time",
    description: "",
    salary: "",
    contactEmail: "",
  });

  const autoPostRanRef = useRef(false);

  const userId = user?._id || user?.id || "";

  // -------- Auth gate (employer only) ----------
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          router.replace("/login?redirect=/post-job");
          return;
        }

        const data = await res.json().catch(() => null);
        const u = data?.user as MeUser | undefined;

        if (!u?.accountType) {
          router.replace("/login?redirect=/post-job");
          return;
        }

        setUser(u);
      } catch (err) {
        console.error("Error fetching user:", err);
        router.replace("/login?redirect=/post-job");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  // -------- Auto-post after payment success ----------
  useEffect(() => {
    if (!router.isReady) return;
    if (autoPostRanRef.current) return;

    const payment = String(router.query.payment || "");
    const tierQ = String(router.query.tier || "");

    const paidTier: ListingTier | null =
      tierQ === "standard"
        ? "standard"
        : tierQ === "featured"
          ? "featured"
          : null;

    // Only auto-post if we have a paid return signal
    if (payment !== "success" || !paidTier) return;

    autoPostRanRef.current = true;

    try {
      const raw =
        typeof window !== "undefined"
          ? window.sessionStorage.getItem(DRAFT_KEY)
          : null;
      if (!raw) {
        setError(
          "Payment completed, but we couldn't find your saved job draft. Please re-enter the details and submit.",
        );
        setTier(paidTier);
        return;
      }

      const draft = JSON.parse(raw) as JobDraft;

      // restore into UI
      setFormData(draft.formData);
      setTier(paidTier);
      setDraftSaved(true);

      // auto-submit paid job
      (async () => {
        await submitJob(draft.formData, paidTier, true);
        // clear query params after posting (prevents accidental duplicates on refresh)
        router.replace("/job-listings");
      })();
    } catch (e) {
      console.error(e);
      setError(
        "Payment completed, but we couldn't restore your draft. Please re-enter the details and submit.",
      );
      setTier(paidTier);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setSuccess(false);
  };

  const isFormValid = () => {
    if (!formData.title.trim()) return false;
    if (!formData.company.trim()) return false;
    if (!formData.location.trim()) return false;
    if (!formData.type.trim()) return false;
    if (!formData.description.trim()) return false;
    if (!formData.contactEmail.trim()) return false;
    return true;
  };

  const saveDraftForCheckout = () => {
    setError("");
    setSuccess(false);

    if (!isFormValid()) {
      setError(
        "Please complete the job form first, then save your draft before checkout.",
      );
      return;
    }

    const draft: JobDraft = {
      formData: {
        ...formData,
        title: formData.title.trim(),
        company: formData.company.trim(),
        location: formData.location.trim(),
        type: formData.type.trim(),
        description: formData.description.trim(),
        salary: formData.salary.trim(),
        contactEmail: formData.contactEmail.trim(),
      },
      tier,
      savedAt: Date.now(),
    };

    try {
      window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      setDraftSaved(true);
    } catch (e) {
      console.error(e);
      setError("Could not save your draft in this browser. Please try again.");
    }
  };

  const submitJob = async (
    fd: typeof formData,
    submitTier: ListingTier,
    isPaid: boolean,
  ) => {
    if (!userId) {
      setError("Missing user id — please log out and log back in.");
      return;
    }

    setSubmitting(true);
    setSuccess(false);
    setError("");

    try {
      const payload = {
        ...fd,
        userId, // ✅ fixed (Mongo _id fallback)
        listingTier: submitTier,
        isFeatured: submitTier === "featured",
        isPaid: isPaid,
      };

      const res = await fetch("/api/jobs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (res.status === 401 || res.status === 403) {
        router.replace("/login?redirect=/post-job");
        return;
      }

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Failed to post job");
      }

      setSuccess(true);

      // clear draft after successful post
      try {
        window.sessionStorage.removeItem(DRAFT_KEY);
      } catch {}

      setTimeout(() => {
        router.push("/job-listings");
      }, 700);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitFree = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) {
      setError("Please complete all required fields.");
      return;
    }
    await submitJob(formData, "free", false);
  };

  if (loading) {
    return <div className="text-white text-center mt-20">Loading...</div>;
  }

  if (!user || user.accountType !== "employer") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center text-center px-4">
        <div>
          <h1 className="text-2xl font-bold mb-4 text-red-500">
            Access Denied
          </h1>
          <p className="mb-6">
            You must be logged in with an <strong>employer account</strong> to
            post jobs.
          </p>
          <Link
            href="/login?redirect=/post-job"
            className="text-gold underline"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const canCheckout = isFormValid() && !!userId;

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-5xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gold mb-2">Post a Job</h1>
            <p className="text-gray-400">
              Add new opportunities and connect with Black professionals looking
              for work.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Signed in as:{" "}
              <span className="text-gray-300">{user.email || "Employer"}</span>
            </p>
          </div>
          <Link href="/">
            <button className="px-4 py-2 bg-gold text-black font-bold rounded hover:bg-yellow-500 transition">
              Home
            </button>
          </Link>
        </div>

        {/* Pricing Options */}
        <div className="grid md:grid-cols-3 gap-4 mb-8 mt-8">
          <TierCard
            title="Free Post"
            subtitle="Basic listing, 1 per account"
            price="$0"
            active={tier === "free"}
            onSelect={() => setTier("free")}
          />

          <TierCard
            title="Standard Post"
            subtitle="30-day listing, enhanced visibility"
            price="$29.99"
            active={tier === "standard"}
            onSelect={() => setTier("standard")}
          >
            <div className="mt-3 space-y-2">
              <button
                type="button"
                onClick={saveDraftForCheckout}
                disabled={!canCheckout}
                className={[
                  "w-full px-3 py-2 rounded font-semibold transition",
                  canCheckout
                    ? "bg-gray-950 text-white hover:bg-gray-900"
                    : "bg-gray-700 text-gray-400 cursor-not-allowed",
                ].join(" ")}
              >
                {draftSaved ? "✅ Draft Saved" : "Save Draft for Checkout"}
              </button>

              <div
                className={canCheckout ? "" : "opacity-50 pointer-events-none"}
              >
                <BuyNowButton
                  itemId="job-standard-post"
                  amount={2999}
                  type="job"
                  label="Buy Standard"
                  userId={userId}
                />
              </div>

              <p className="text-xs text-gray-400">
                After payment, you’ll return here and we’ll post the job
                automatically.
              </p>
            </div>
          </TierCard>

          <TierCard
            title="Featured Post"
            subtitle="Homepage promo, pinned, bold style"
            price="$79.99"
            active={tier === "featured"}
            onSelect={() => setTier("featured")}
          >
            <div className="mt-3 space-y-2">
              <button
                type="button"
                onClick={saveDraftForCheckout}
                disabled={!canCheckout}
                className={[
                  "w-full px-3 py-2 rounded font-semibold transition",
                  canCheckout
                    ? "bg-gray-950 text-white hover:bg-gray-900"
                    : "bg-gray-700 text-gray-400 cursor-not-allowed",
                ].join(" ")}
              >
                {draftSaved ? "✅ Draft Saved" : "Save Draft for Checkout"}
              </button>

              <div
                className={canCheckout ? "" : "opacity-50 pointer-events-none"}
              >
                <BuyNowButton
                  itemId="job-featured-post"
                  amount={7999}
                  type="job"
                  label="Buy Featured"
                  userId={userId}
                />
              </div>

              <p className="text-xs text-gray-400">
                After payment, you’ll return here and we’ll post the job
                automatically.
              </p>
            </div>
          </TierCard>
        </div>

        {success && (
          <p className="text-green-500 mb-4">
            ✅ Job posted successfully! Redirecting...
          </p>
        )}
        {error && <p className="text-red-500 mb-4">{error}</p>}

        {/* Form */}
        <form onSubmit={handleSubmitFree} className="space-y-4">
          <input
            type="text"
            name="title"
            placeholder="Job Title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full p-3 rounded bg-gray-700 border border-gray-600"
          />
          <input
            type="text"
            name="company"
            placeholder="Company Name"
            value={formData.company}
            onChange={handleChange}
            required
            className="w-full p-3 rounded bg-gray-700 border border-gray-600"
          />
          <input
            type="text"
            name="location"
            placeholder="Location (Remote, City/State)"
            value={formData.location}
            onChange={handleChange}
            required
            className="w-full p-3 rounded bg-gray-700 border border-gray-600"
          />

          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
            className="w-full p-3 rounded bg-gray-700 border border-gray-600"
          >
            <option value="">Select Job Type</option>
            <option value="Full-Time">Full-Time</option>
            <option value="Part-Time">Part-Time</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
            <option value="Freelance">Freelance</option>
          </select>

          <textarea
            name="description"
            placeholder="Job Description"
            value={formData.description}
            onChange={handleChange}
            rows={6}
            required
            className="w-full p-3 rounded bg-gray-700 border border-gray-600"
          />

          <input
            type="text"
            name="salary"
            placeholder="Salary (optional)"
            value={formData.salary}
            onChange={handleChange}
            className="w-full p-3 rounded bg-gray-700 border border-gray-600"
          />

          <input
            type="email"
            name="contactEmail"
            placeholder="Contact Email"
            value={formData.contactEmail}
            onChange={handleChange}
            required
            className="w-full p-3 rounded bg-gray-700 border border-gray-600"
          />

          {/* Free post submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-gold text-black font-semibold rounded hover:bg-yellow-500 transition"
          >
            {submitting ? "Posting..." : "Post Free Job"}
          </button>

          <p className="text-xs text-gray-400">
            Posting Standard/Featured: fill out the form →{" "}
            <strong>Save Draft</strong> → checkout.
          </p>
        </form>

        <div className="text-center mt-6">
          <Link
            href="/dashboard/employer"
            className="text-blue-500 hover:underline"
          >
            ← Back to Employer Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

function TierCard({
  title,
  subtitle,
  price,
  active,
  onSelect,
  children,
}: {
  title: string;
  subtitle: string;
  price: string;
  active: boolean;
  onSelect: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={[
        "bg-gray-900 p-4 rounded shadow text-center border transition",
        active
          ? "border-yellow-400/60"
          : "border-gray-800 hover:border-yellow-400/30",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-bold text-gold">{title}</h3>
        <button
          type="button"
          onClick={onSelect}
          className={[
            "text-xs px-2 py-1 rounded border transition",
            active
              ? "border-yellow-400/60 text-yellow-300 bg-yellow-400/10"
              : "border-gray-700 text-gray-300 hover:bg-gray-800",
          ].join(" ")}
        >
          {active ? "Selected" : "Select"}
        </button>
      </div>

      <p className="text-sm text-gray-400 mt-2">{subtitle}</p>
      <p className="font-semibold mt-2">{price}</p>

      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}

export default PostJob;
