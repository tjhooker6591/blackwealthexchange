import type { GetServerSideProps } from "next";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import {
  parseSessionIdentity,
  resolveVerifiedOwnership,
} from "@/lib/directoryOwnership";
import BusinessUpdateComposer from "@/components/business/BusinessUpdateComposer";
import BusinessPostNudge from "@/components/business/BusinessPostNudge";

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
};

type Cta = { label: string; url: string };

interface BusinessProfile {
  id: string;
  displayName: string;
  shortSummary: string;
  description: string;
  publicEmail: string;
  phone: string;
  website: string;
  streetAddress: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  serviceArea: string;
  primaryCategory: string;
  secondaryCategoriesText: string;
  logo: string;
  coverImage: string;
  galleryImagesText: string;
  facebook: string;
  instagram: string;
  linkedin: string;
  twitter: string;
  youtube: string;
  tiktok: string;
  operatingHours: string;
  tagsText: string;
  offeringsSummary: string;
  primaryCtaLabel: string;
  primaryCtaUrl: string;
  additionalCtasText: string;
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
  "user",
  "business",
  "seller",
  "employer",
  "admin",
];

const EMPTY_FORM: BusinessProfile = {
  id: "",
  displayName: "",
  shortSummary: "",
  description: "",
  publicEmail: "",
  phone: "",
  website: "",
  streetAddress: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  serviceArea: "",
  primaryCategory: "",
  secondaryCategoriesText: "",
  logo: "",
  coverImage: "",
  galleryImagesText: "",
  facebook: "",
  instagram: "",
  linkedin: "",
  twitter: "",
  youtube: "",
  tiktok: "",
  operatingHours: "",
  tagsText: "",
  offeringsSummary: "",
  primaryCtaLabel: "",
  primaryCtaUrl: "",
  additionalCtasText: "",
};

function toLines(ctas: Cta[] | undefined) {
  return Array.isArray(ctas)
    ? ctas.map((cta) => `${cta.label} | ${cta.url}`).join("\n")
    : "";
}

function parseAdditionalCtas(text: string) {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, url] = line.split("|").map((part) => part.trim());
      return label && url ? { label, url } : null;
    })
    .filter(Boolean);
}

function parseCommaSeparatedList(text: string) {
  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseLineSeparatedList(text: string) {
  return text
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

type EditBusinessPageProps = {
  initialDenied?: boolean;
  initialBusinessId?: string;
};

export const getServerSideProps: GetServerSideProps<
  EditBusinessPageProps
> = async ({ req, query }) => {
  const rawBusinessId = String(query.businessId || query.id || "").trim();
  if (!rawBusinessId) {
    return {
      redirect: {
        destination: "/business/profile",
        permanent: false,
      },
    };
  }

  const session = parseSessionIdentity(req as any);
  if (!session) {
    return {
      redirect: {
        destination: `/login?redirect=${encodeURIComponent(`/edit-business?businessId=${rawBusinessId}`)}`,
        permanent: false,
      },
    };
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const ownership = await resolveVerifiedOwnership(db, {
      entityType: "business",
      entityId: rawBusinessId,
      userId: session.userId,
    });

    if (!ownership) {
      return {
        redirect: {
          destination: "/business/profile",
          permanent: false,
        },
      };
    }
  } catch {
    return {
      props: {
        initialDenied: true,
        initialBusinessId: rawBusinessId,
      },
    };
  }

  return {
    props: {
      initialDenied: false,
      initialBusinessId: rawBusinessId,
    },
  };
};

export default function EditBusinessPage({
  initialDenied = false,
  initialBusinessId = "",
}: EditBusinessPageProps) {
  const router = useRouter();
  const businessId = useMemo(() => {
    const raw = router.query.businessId;
    const fromQuery = Array.isArray(raw) ? raw[0] || "" : raw || "";
    return fromQuery || initialBusinessId;
  }, [router.query.businessId, initialBusinessId]);

  const [me, setMe] = useState<MeUser | null>(null);
  const [business, setBusiness] = useState<BusinessProfile>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{
    type: "idle" | "success" | "error";
    message: string;
  }>({
    type: "idle",
    message: "",
  });

  const canAccess = useMemo(() => {
    const role = me?.accountType;
    return role ? ALLOWED_ROLES.includes(role) : false;
  }, [me]);

  useEffect(() => {
    if (!router.isReady) return;
    if (initialDenied) {
      setLoading(false);
      setStatus({ type: "error", message: "Access denied." });
      return;
    }
    if (!businessId) {
      setLoading(false);
      setStatus({ type: "error", message: "Missing business identifier." });
      return;
    }

    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
          signal: controller.signal,
        });

        if (!res.ok) {
          router.replace(
            `/login?redirect=${encodeURIComponent(`/edit-business?businessId=${businessId}`)}`,
          );
          return;
        }

        const data = await res.json().catch(() => null);
        const user = (data?.user ?? null) as MeUser | null;
        if (!user?.email || !user?.accountType) {
          router.replace(
            `/login?redirect=${encodeURIComponent(`/edit-business?businessId=${businessId}`)}`,
          );
          return;
        }

        setMe(user);

        const profileRes = await fetch(
          `/api/business/profile?businessId=${encodeURIComponent(businessId)}`,
          {
            cache: "no-store",
            credentials: "include",
            signal: controller.signal,
          },
        );

        const payload = await profileRes.json().catch(() => null);
        if (!profileRes.ok) {
          setStatus({
            type: "error",
            message: payload?.error || "Failed to load business profile.",
          });
          setBusiness(EMPTY_FORM);
          return;
        }

        const profile = payload?.business || {};
        setBusiness({
          id: profile.id || businessId,
          displayName: profile.displayName || "",
          shortSummary: profile.shortSummary || "",
          description: profile.description || "",
          publicEmail: profile.publicEmail || user.email || "",
          phone: profile.phone || "",
          website: profile.website || "",
          streetAddress: profile.streetAddress || "",
          addressLine2: profile.addressLine2 || "",
          city: profile.city || "",
          state: profile.state || "",
          postalCode: profile.postalCode || "",
          serviceArea: profile.serviceArea || "",
          primaryCategory: profile.primaryCategory || "",
          secondaryCategoriesText: Array.isArray(profile.secondaryCategories)
            ? profile.secondaryCategories.join(", ")
            : "",
          logo: profile.logo || "",
          coverImage: profile.coverImage || "",
          galleryImagesText: Array.isArray(profile.galleryImages)
            ? profile.galleryImages.join("\n")
            : "",
          facebook: profile.facebook || "",
          instagram: profile.instagram || "",
          linkedin: profile.linkedin || "",
          twitter: profile.twitter || "",
          youtube: profile.youtube || "",
          tiktok: profile.tiktok || "",
          operatingHours: profile.operatingHours || "",
          tagsText: Array.isArray(profile.tags) ? profile.tags.join(", ") : "",
          offeringsSummary: profile.offeringsSummary || "",
          primaryCtaLabel: profile.primaryCtaLabel || "",
          primaryCtaUrl: profile.primaryCtaUrl || "",
          additionalCtasText: toLines(profile.additionalCtas),
        });
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          setStatus({ type: "error", message: "Error loading business info." });
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [router, businessId, initialDenied]);

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
        body: JSON.stringify({
          businessId: business.id,
          displayName: business.displayName,
          shortSummary: business.shortSummary,
          description: business.description,
          publicEmail: business.publicEmail,
          phone: business.phone,
          website: business.website,
          streetAddress: business.streetAddress,
          addressLine2: business.addressLine2,
          city: business.city,
          state: business.state,
          postalCode: business.postalCode,
          serviceArea: business.serviceArea,
          primaryCategory: business.primaryCategory,
          secondaryCategories: parseCommaSeparatedList(
            business.secondaryCategoriesText,
          ),
          logo: business.logo,
          coverImage: business.coverImage,
          galleryImages: parseLineSeparatedList(business.galleryImagesText),
          facebook: business.facebook,
          instagram: business.instagram,
          linkedin: business.linkedin,
          twitter: business.twitter,
          youtube: business.youtube,
          tiktok: business.tiktok,
          operatingHours: business.operatingHours,
          tags: parseCommaSeparatedList(business.tagsText),
          offeringsSummary: business.offeringsSummary,
          primaryCtaLabel: business.primaryCtaLabel,
          primaryCtaUrl: business.primaryCtaUrl,
          additionalCtas: parseAdditionalCtas(business.additionalCtasText),
        }),
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
    } catch {
      setStatus({ type: "error", message: "An error occurred while saving." });
    } finally {
      setSaving(false);
    }
  };

  const fields: Array<{
    key: keyof BusinessProfile;
    label: string;
    type?: string;
    textarea?: boolean;
    placeholder?: string;
  }> = [
    { key: "displayName", label: "Display Name" },
    { key: "publicEmail", label: "Public Contact Email", type: "email" },
    { key: "phone", label: "Phone", type: "tel" },
    { key: "website", label: "Website", placeholder: "yourbusiness.com" },
    { key: "streetAddress", label: "Street Address" },
    { key: "addressLine2", label: "Address Line 2" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "postalCode", label: "ZIP / Postal Code" },
    { key: "serviceArea", label: "Service Area" },
    { key: "primaryCategory", label: "Primary Category" },
    { key: "shortSummary", label: "Short Summary", textarea: true },
    { key: "description", label: "Full Description", textarea: true },
    { key: "secondaryCategoriesText", label: "Secondary Categories" },
    { key: "logo", label: "Logo URL" },
    { key: "coverImage", label: "Primary / Cover Image URL" },
    {
      key: "galleryImagesText",
      label: "Gallery Images (one per line)",
      textarea: true,
    },
    { key: "facebook", label: "Facebook" },
    { key: "instagram", label: "Instagram" },
    { key: "linkedin", label: "LinkedIn" },
    { key: "twitter", label: "Twitter / X" },
    { key: "youtube", label: "YouTube" },
    { key: "tiktok", label: "TikTok" },
    { key: "operatingHours", label: "Operating Hours", textarea: true },
    { key: "tagsText", label: "Tags / Specialties / Keywords" },
    {
      key: "offeringsSummary",
      label: "Products / Services Summary",
      textarea: true,
    },
    { key: "primaryCtaLabel", label: "Primary CTA Label" },
    { key: "primaryCtaUrl", label: "Primary CTA URL" },
    {
      key: "additionalCtasText",
      label: "Additional CTA Links (Label | URL per line)",
      textarea: true,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading…
      </div>
    );
  }

  if (initialDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Access denied.
      </div>
    );
  }

  if (me && !canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Access denied.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      <GlowBackground />
      <div className="relative max-w-4xl mx-auto p-6 space-y-6">
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

        <header>
          <h1 className="text-3xl md:text-4xl font-extrabold text-yellow-300">
            Edit Business Profile
          </h1>
          <p className="text-gray-300 mt-1">
            Update ordinary public profile content for your verified listing.
          </p>
        </header>

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

        {business.id ? (
          <>
            <BusinessPostNudge businessId={business.id} />
            <BusinessUpdateComposer businessId={business.id} />
          </>
        ) : null}

        <section className="rounded-2xl border border-yellow-500/15 bg-gray-900/50 p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <input type="hidden" name="id" value={business.id} />
            <div className="grid gap-4 md:grid-cols-2">
              {fields.map((field) => (
                <div
                  key={field.key}
                  className={field.textarea ? "md:col-span-2" : ""}
                >
                  <label
                    htmlFor={field.key}
                    className="block mb-1 font-semibold text-gray-200"
                  >
                    {field.label}
                  </label>
                  {field.textarea ? (
                    <textarea
                      id={field.key}
                      name={field.key}
                      value={business[field.key] as string}
                      onChange={handleChange}
                      placeholder={field.placeholder}
                      className="w-full min-h-[120px] rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-yellow-500/60"
                    />
                  ) : (
                    <input
                      id={field.key}
                      name={field.key}
                      type={field.type || "text"}
                      value={business[field.key] as string}
                      onChange={handleChange}
                      placeholder={field.placeholder}
                      className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-yellow-500/60"
                    />
                  )}
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex justify-center rounded-xl bg-yellow-500 px-6 py-3 font-bold text-black hover:bg-yellow-400 transition shadow disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
