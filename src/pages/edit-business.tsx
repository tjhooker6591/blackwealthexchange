// src/pages/edit-business.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

type AccountType =
  | "user"
  | "business"
  | "seller"
  | "employer"
  | "admin"
  | string;

type MeUser = {
  email: string;
  accountType: AccountType;
  businessName?: string;
};

interface BusinessProfile {
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  description: string;
}

function GlowBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 opacity-60">
      <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-yellow-500/10 blur-3xl" />
      <div className="absolute top-[38%] left-[12%] h-[320px] w-[320px] rounded-full bg-yellow-500/5 blur-3xl" />
    </div>
  );
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const ALLOWED_ROLES: AccountType[] = [
  "business",
  "seller",
  "employer",
  "admin",
];

export default function EditBusinessPage() {
  const router = useRouter();

  const [me, setMe] = useState<MeUser | null>(null);
  const [business, setBusiness] = useState<BusinessProfile>({
    businessName: "",
    businessAddress: "",
    businessPhone: "",
    description: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [status, setStatus] = useState<{
    type: "idle" | "success" | "error";
    message: string;
  }>({ type: "idle", message: "" });

  const canAccess = useMemo(() => {
    const role = me?.accountType;
    return role ? ALLOWED_ROLES.includes(role) : false;
  }, [me]);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        // 1) Verify session (cookies must be included)
        const res = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
          signal: controller.signal,
        });

        if (!res.ok) {
          router.replace("/login?redirect=/edit-business");
          return;
        }

        const data = await res.json().catch(() => null);
        const user = (data?.user ?? null) as MeUser | null;

        if (!user?.email || !user?.accountType) {
          router.replace("/login?redirect=/edit-business");
          return;
        }

        setMe(user);

        // 2) Enforce allowed roles (shared business dashboard roles)
        if (!ALLOWED_ROLES.includes(user.accountType)) {
          router.replace("/login?redirect=/edit-business");
          return;
        }

        // 3) Fetch business profile
        // Best practice: API should infer identity from session (no email query param).
        // If your current API REQUIRES email, uncomment the email param line below.
        const profileUrl = "/api/business/profile";
        // + `?email=${encodeURIComponent(user.email)}`;

        const profileRes = await fetch(profileUrl, {
          cache: "no-store",
          credentials: "include",
          signal: controller.signal,
        });

        if (profileRes.ok) {
          const payload = await profileRes.json().catch(() => null);
          const profile = payload?.business ?? payload;

          setBusiness({
            businessName: profile?.businessName ?? "",
            businessAddress: profile?.businessAddress ?? "",
            businessPhone: profile?.businessPhone ?? "",
            description: profile?.description ?? "",
          });
        } else {
          // Not fatal; they can still fill it out and save
          console.error("Failed to load business profile");
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("Error loading business info:", err);
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setStatus({ type: "idle", message: "" });
    setBusiness((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus({ type: "idle", message: "" });

    try {
      const res = await fetch("/api/business/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify(business),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setStatus({ type: "error", message: data?.error || "Update failed." });
        return;
      }

      setStatus({
        type: "success",
        message: "Business profile updated successfully.",
      });
    } catch (err) {
      console.error("Update error:", err);
      setStatus({ type: "error", message: "An error occurred while saving." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white relative p-6">
        <GlowBackground />
        <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
          <div className="h-6 w-2/3 bg-white/10 rounded animate-pulse" />
          <div className="mt-3 h-4 w-1/2 bg-white/10 rounded animate-pulse" />
          <div className="mt-6 h-10 w-full bg-white/10 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  // In case a role slips through before redirect completes
  if (me && !canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white relative p-6">
        <GlowBackground />
        <div className="relative w-full max-w-lg rounded-2xl border border-red-500/25 bg-red-500/10 p-6 shadow-xl">
          <div className="text-xl font-bold text-red-200">Access denied.</div>
          <p className="text-gray-200 mt-2">
            Your account type does not have permission to edit a business
            profile.
          </p>
          <Link
            href="/"
            className="inline-block mt-4 px-4 py-2 rounded-xl bg-yellow-400 text-black font-semibold hover:bg-yellow-300 transition"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      <GlowBackground />

      <div className="relative max-w-3xl mx-auto p-6 space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition"
          >
            ← Back
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-full bg-yellow-400 px-4 py-2 font-semibold text-black hover:bg-yellow-300 transition"
          >
            Dashboard
          </Link>
        </div>

        {/* Title */}
        <header>
          <h1 className="text-3xl md:text-4xl font-extrabold text-yellow-300">
            Edit Business Profile
          </h1>
          <p className="text-gray-300 mt-1">
            Keep your listing accurate—this improves trust and visibility across
            BWE.
          </p>
        </header>

        {/* Status */}
        {status.type !== "idle" && status.message ? (
          <div
            className={cx(
              "rounded-2xl border px-4 py-3 shadow",
              status.type === "success" &&
                "border-green-500/35 bg-green-500/10 text-green-200",
              status.type === "error" &&
                "border-red-500/35 bg-red-500/10 text-red-200",
            )}
          >
            {status.message}
          </div>
        ) : null}

        {/* Form card */}
        <section className="rounded-2xl border border-yellow-500/15 bg-gray-900/50 p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="businessName"
                className="block mb-1 font-semibold text-gray-200"
              >
                Business Name
              </label>
              <input
                id="businessName"
                name="businessName"
                value={business.businessName}
                onChange={handleChange}
                className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-yellow-500/60"
                required
              />
            </div>

            <div>
              <label
                htmlFor="businessAddress"
                className="block mb-1 font-semibold text-gray-200"
              >
                Business Address
              </label>
              <input
                id="businessAddress"
                name="businessAddress"
                value={business.businessAddress}
                onChange={handleChange}
                className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-yellow-500/60"
                required
              />
            </div>

            <div>
              <label
                htmlFor="businessPhone"
                className="block mb-1 font-semibold text-gray-200"
              >
                Business Phone
              </label>
              <input
                id="businessPhone"
                name="businessPhone"
                type="tel"
                value={business.businessPhone}
                onChange={handleChange}
                className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-yellow-500/60"
                required
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block mb-1 font-semibold text-gray-200"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={business.description}
                onChange={handleChange}
                className="w-full min-h-[140px] rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-yellow-500/60"
                required
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex justify-center rounded-xl bg-yellow-500 px-6 py-3 font-bold text-black hover:bg-yellow-400 transition shadow disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>

            <p className="text-xs text-gray-400">
              Note: If your API currently requires <code>?email=</code> for
              profile fetch, uncomment it in the code above. Long-term, it’s
              better for the server to infer identity from the session cookie.
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}
