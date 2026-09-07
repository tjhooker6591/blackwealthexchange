import React, { useEffect, useMemo, useState } from "react";
import type { GetServerSideProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import {
  mapDirectoryProfileFromDoc,
  normalizeDirectoryLocationParts,
} from "@/lib/directoryProfileContract";

type Business = {
  _id?: string;
  alias?: string;
  business_name?: string;
  name?: string;
  shortSummary?: string;
  categories?: string | string[];
  address?: string;
  fullAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  serviceArea?: string;
  description?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  website?: string;
  image?: string;
  logo?: string;
  galleryImages?: string[];
  operatingHours?: string;
  offeringsSummary?: string;
  tags?: string[];
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  youtube?: string;
  tiktok?: string;
  primaryCtaLabel?: string;
  primaryCtaUrl?: string;
  additionalCtas?: Array<{ label?: string; url?: string }>;
  verified?: boolean;
  isVerified?: boolean;
  status?: string;
  claimStage?: string;
  claimLocked?: boolean;
  claimedByUserId?: string;
  claimedByEmail?: string;
  foundingMembershipId?: string;
  ownershipReviewStatus?: string;
  amountPaid?: number;
  completenessScore?: number;
  isComplete?: boolean;
  publicListingStatus?: string;
};

function safeStr(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (v == null) return "";
  return String(v).trim();
}

function getTitle(b: Business) {
  return safeStr(b.business_name) || safeStr(b.name) || "Business";
}

function toCategoryText(v: Business["categories"]) {
  if (Array.isArray(v))
    return v
      .map((x) => safeStr(x))
      .filter(Boolean)
      .join(", ");
  return safeStr(v);
}

function safeWebsite(url?: string) {
  const u = safeStr(url);
  if (!u) return "";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return `https://${u}`;
}

function trackFlowEvent(payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const body = JSON.stringify(payload);
  const url = "/api/flow-events";
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
    return;
  }
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

type Props = {
  initialAlias?: string | null;
  initialBusiness?: Business | null;
  initialError?: string;
};

function normalizeBusinessDoc(doc: any): Business {
  const profile = mapDirectoryProfileFromDoc(doc);
  const locationParts = normalizeDirectoryLocationParts(doc);
  return {
    _id: safeStr(doc?._id || profile.id),
    alias: safeStr(doc?.alias || doc?.slug),
    business_name: safeStr(profile.displayName),
    name: safeStr(doc?.name),
    shortSummary: safeStr(profile.shortSummary),
    categories:
      Array.isArray(profile.secondaryCategories) &&
      profile.secondaryCategories.length > 0
        ? profile.secondaryCategories
        : safeStr(profile.primaryCategory),
    address: locationParts.streetAddress,
    fullAddress: locationParts.fullAddress,
    city: locationParts.city,
    state: locationParts.state,
    postalCode: locationParts.postalCode,
    serviceArea: safeStr(profile.serviceArea),
    description: safeStr(profile.description) || "No description available",
    phone: safeStr(profile.phone),
    latitude: typeof doc?.latitude === "number" ? doc.latitude : null,
    longitude: typeof doc?.longitude === "number" ? doc.longitude : null,
    website: safeStr(profile.website),
    image: safeStr(profile.coverImage),
    logo: safeStr(profile.logo),
    galleryImages: Array.isArray(profile.galleryImages)
      ? profile.galleryImages
      : [],
    operatingHours: safeStr(profile.operatingHours),
    offeringsSummary: safeStr(profile.offeringsSummary),
    tags: Array.isArray(profile.tags) ? profile.tags : [],
    facebook: safeStr(profile.facebook),
    instagram: safeStr(profile.instagram),
    linkedin: safeStr(profile.linkedin),
    twitter: safeStr(profile.twitter),
    youtube: safeStr(profile.youtube),
    tiktok: safeStr(profile.tiktok),
    primaryCtaLabel: safeStr(profile.primaryCtaLabel),
    primaryCtaUrl: safeStr(profile.primaryCtaUrl),
    additionalCtas: Array.isArray(profile.additionalCtas)
      ? profile.additionalCtas
      : [],
    verified: doc?.verified === true,
    // Verification-field drift fix (2026-09-07): isVerified is deprecated,
    // always derived from the canonical `verified` field.
    isVerified: doc?.verified === true,
    status: safeStr(doc?.status),
    claimStage: safeStr(doc?.claimStage),
    claimLocked: doc?.claimLocked === true,
    claimedByUserId: safeStr(doc?.claimedByUserId),
    claimedByEmail: safeStr(doc?.claimedByEmail),
    foundingMembershipId: safeStr(doc?.foundingMembershipId),
    ownershipReviewStatus: safeStr(doc?.ownershipReviewStatus),
    amountPaid: Number(doc?.amountPaid || 0),
    completenessScore: Number(doc?.completenessScore || 0),
    isComplete: typeof doc?.isComplete === "boolean" ? doc.isComplete : null,
    publicListingStatus: safeStr(doc?.publicListingStatus),
  } as Business;
}

export default function BusinessDetail({
  initialAlias,
  initialBusiness,
  initialError,
}: Props) {
  const router = useRouter();
  const alias = useMemo(() => {
    const raw = router.query.alias;
    const routeAlias = Array.isArray(raw) ? raw[0] : raw;
    return routeAlias || initialAlias || undefined;
  }, [initialAlias, router.query.alias]);

  const [business] = useState<Business | null>(initialBusiness || null);
  const [isLoading] = useState(!initialBusiness && !initialError);
  const [error] = useState(initialError || "");

  const source = useMemo(() => {
    const raw = router.query.from;
    return Array.isArray(raw) ? raw[0] : raw || "directory";
  }, [router.query.from]);

  const claimMode = useMemo(() => {
    const raw = router.query.mode;
    return (Array.isArray(raw) ? raw[0] : raw) === "claim";
  }, [router.query.mode]);

  useEffect(() => {
    if (!business || !alias) return;
    trackFlowEvent({
      eventType: "business_detail_view",
      businessAlias: alias,
      source,
    });
  }, [business, alias, source]);

  const website = safeWebsite(business?.website);
  const categoryText = toCategoryText(business?.categories);
  const cityState = [safeStr(business?.city), safeStr(business?.state)]
    .filter(Boolean)
    .join(", ");
  const placeLine = [cityState, safeStr(business?.postalCode)]
    .filter(Boolean)
    .join(cityState && safeStr(business?.postalCode) ? " " : "");
  const locationText = [
    safeStr(business?.fullAddress),
    safeStr(business?.address),
    placeLine,
  ]
    .filter(Boolean)
    .join(", ");
  const hasLatLng =
    typeof business?.latitude === "number" &&
    typeof business?.longitude === "number";
  const mapQuery = hasLatLng
    ? `${business?.latitude},${business?.longitude}`
    : locationText;

  const status = safeStr(business?.status).toLowerCase();
  const claimStage = safeStr(business?.claimStage).toLowerCase();
  const publicListingStatus = safeStr(
    (business as any)?.publicListingStatus,
  ).toLowerCase();
  const claimLocked = business?.claimLocked === true;
  const trust = {
    // Verification-field drift fix (2026-09-07): `verified` is canonical;
    // isVerified no longer read independently.
    verified: business?.verified === true || status === "verified",
    approved: status === "approved" || status === "verified" || !status,
    sponsored: Number(business?.amountPaid || 0) > 0,
    complete:
      typeof business?.isComplete === "boolean"
        ? business.isComplete
        : Number(business?.completenessScore || 0) >= 70,
    claimStage,
  };
  const canonicalBusinessId = safeStr(business?._id);
  const canClaim =
    Boolean(canonicalBusinessId) &&
    !trust.verified &&
    publicListingStatus !== "ownership_verified" &&
    !claimLocked &&
    ![
      "claim_initiated",
      "ownership_verification_pending",
      "additional_evidence_required",
      "disputed",
      "founding_growth_member",
      "ownership_verified",
    ].includes(claimStage);

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-[#D4AF37]/16 via-transparent to-transparent" />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[40rem] -translate-x-1/2 rounded-full bg-[#D4AF37]/10 blur-3xl" />

      <div className="relative mx-auto max-w-5xl px-4 py-8 md:py-10">
        <div className="mb-5 flex items-center justify-between gap-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/80 transition hover:bg-white/[0.08]"
          >
            <span className="text-[#D4AF37]">←</span>
            Back
          </button>

          <div className="flex items-center gap-3 text-sm">
            {source === "search-results" && safeStr(router.query.q) ? (
              <Link
                href={`/search-results?search=${encodeURIComponent(safeStr(router.query.q))}`}
                className="text-white/70 underline underline-offset-4 transition hover:text-white"
              >
                Back to search results
              </Link>
            ) : null}
            <Link
              href={
                claimMode
                  ? "/business-directory?mode=claim"
                  : "/business-directory"
              }
              className="text-white/65 underline underline-offset-4 transition hover:text-white"
            >
              {claimMode ? "Claim mode directory" : "Directory"}
            </Link>
          </div>
        </div>

        <section className="overflow-hidden rounded-3xl border border-white/12 bg-gradient-to-b from-white/[0.07] via-white/[0.035] to-white/[0.02] shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_28px_80px_rgba(0,0,0,0.5)]">
          {isLoading ? (
            <div className="p-6 md:p-8">
              <div className="mb-4 h-8 w-2/3 animate-pulse rounded bg-white/10" />
              <div className="mb-6 h-4 w-1/2 animate-pulse rounded bg-white/10" />
              <div className="space-y-2">
                <div className="h-4 animate-pulse rounded bg-white/10" />
                <div className="h-4 animate-pulse rounded bg-white/10" />
                <div className="h-4 w-4/5 animate-pulse rounded bg-white/10" />
              </div>
            </div>
          ) : error ? (
            <div className="p-6 md:p-8">
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            </div>
          ) : !business ? (
            <div className="p-6 md:p-8 text-white/70">
              <div className="text-white/80 font-semibold">
                Business not found.
              </div>
              <p className="mt-1 text-sm text-white/55">
                This listing may have moved or the search query was too narrow.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {safeStr(router.query.q) ? (
                  <Link
                    href={`/search-results?search=${encodeURIComponent(safeStr(router.query.q))}`}
                    className="rounded-lg bg-[#D4AF37] px-3 py-1.5 text-xs font-extrabold text-black"
                  >
                    Back to Search Results
                  </Link>
                ) : null}
                <Link
                  href="/business-directory"
                  className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/80"
                >
                  Browse Full Directory
                </Link>
              </div>
            </div>
          ) : (
            <>
              <header className="border-b border-white/10 p-6 md:p-8">
                <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.09em] text-[#D4AF37]/90">
                  Business profile
                </div>
                <h1 className="text-2xl font-black tracking-tight text-[#F1D57A] md:text-3xl">
                  {getTitle(business)}
                </h1>

                <div className="mt-2 text-sm text-white/70">
                  {[
                    categoryText,
                    placeLine ||
                      safeStr(business.fullAddress) ||
                      safeStr(business.address),
                  ]
                    .filter(Boolean)
                    .join(" • ") || "Black-owned business"}
                </div>
                {safeStr(business.serviceArea) ? (
                  <div className="mt-2 text-sm text-white/80">
                    Service area: {safeStr(business.serviceArea)}
                  </div>
                ) : null}
                {safeStr(business.shortSummary) ? (
                  <p className="mt-3 max-w-3xl text-sm text-white/75">
                    {safeStr(business.shortSummary)}
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-2">
                  {trust.verified ? (
                    <span className="rounded-full border border-emerald-400/35 bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-200">
                      Verified
                    </span>
                  ) : null}
                  {trust.sponsored && (
                    <span className="rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-3 py-1 text-xs font-bold text-[#D4AF37]">
                      Sponsored
                    </span>
                  )}
                  {!trust.complete && (
                    <span className="rounded-full border border-sky-400/30 bg-sky-400/15 px-3 py-1 text-xs font-bold text-sky-200">
                      Profile needs more details
                    </span>
                  )}
                </div>
              </header>

              <div className="grid gap-4 p-6 md:grid-cols-3 md:p-8">
                <article className="md:col-span-2 space-y-4 rounded-2xl border border-white/12 bg-black/35 p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">
                  <div>
                    <h2 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-white/80">
                      About
                    </h2>
                    <p className="leading-relaxed text-white/75">
                      {safeStr(business.description) ||
                        "Business details are being expanded."}
                    </p>
                  </div>

                  {safeStr(business.offeringsSummary) ? (
                    <div>
                      <h3 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-white/80">
                        Products and services
                      </h3>
                      <p className="leading-relaxed text-white/75">
                        {safeStr(business.offeringsSummary)}
                      </p>
                    </div>
                  ) : null}

                  {Array.isArray(business.tags) && business.tags.length > 0 ? (
                    <div>
                      <h3 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-white/80">
                        Specialties
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {business.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/80"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {Array.isArray(business.galleryImages) &&
                  business.galleryImages.length > 0 ? (
                    <div>
                      <h3 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-white/80">
                        Gallery
                      </h3>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {business.galleryImages
                          .slice(0, 4)
                          .map((image, index) => (
                            <a
                              key={`${image}-${index}`}
                              href={image}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-yellow-200 hover:bg-white/[0.06] break-all"
                            >
                              {image}
                            </a>
                          ))}
                      </div>
                    </div>
                  ) : null}

                  {Array.isArray(business.additionalCtas) &&
                  business.additionalCtas.length > 0 ? (
                    <div>
                      <h3 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-white/80">
                        More ways to connect
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {business.additionalCtas.map((cta, index) =>
                          safeStr(cta?.label) && safeStr(cta?.url) ? (
                            <a
                              key={`${cta?.label}-${index}`}
                              href={safeWebsite(cta?.url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-white/85 transition hover:bg-white/[0.08]"
                            >
                              {safeStr(cta?.label)}
                            </a>
                          ) : null,
                        )}
                      </div>
                    </div>
                  ) : null}
                </article>

                <aside className="space-y-3 rounded-2xl border border-white/12 bg-black/35 p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">
                  {safeStr(business.serviceArea) ? (
                    <div className="text-sm">
                      <div className="text-white/55">Service area</div>
                      <div className="text-white/80 font-medium">
                        {safeStr(business.serviceArea)}
                      </div>
                    </div>
                  ) : null}

                  <div className="text-sm">
                    <div className="text-white/55">Address</div>
                    <div className="text-white/80 font-medium">
                      {safeStr(business.fullAddress) ||
                        safeStr(business.address) ||
                        placeLine ||
                        "—"}
                    </div>
                  </div>

                  <div className="text-sm">
                    <div className="text-white/55">Phone</div>
                    <div className="text-white/80">
                      {safeStr(business.phone) || "—"}
                    </div>
                  </div>

                  <div className="text-sm">
                    <div className="text-white/55">Website</div>
                    {website ? (
                      <a
                        href={website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-[#D4AF37] underline underline-offset-4 hover:text-yellow-300"
                      >
                        {website}
                      </a>
                    ) : (
                      <div className="text-white/80">—</div>
                    )}
                  </div>

                  {safeStr(business.operatingHours) ? (
                    <div className="text-sm">
                      <div className="text-white/55">Hours</div>
                      <div className="whitespace-pre-line text-white/80">
                        {safeStr(business.operatingHours)}
                      </div>
                    </div>
                  ) : null}

                  {[
                    ["Facebook", business.facebook],
                    ["Instagram", business.instagram],
                    ["LinkedIn", business.linkedin],
                    ["Twitter / X", business.twitter],
                    ["YouTube", business.youtube],
                    ["TikTok", business.tiktok],
                  ].some(([, value]) => safeStr(value)) ? (
                    <div className="text-sm">
                      <div className="text-white/55">Social</div>
                      <div className="mt-1 space-y-1 text-white/80">
                        {[
                          ["Facebook", business.facebook],
                          ["Instagram", business.instagram],
                          ["LinkedIn", business.linkedin],
                          ["Twitter / X", business.twitter],
                          ["YouTube", business.youtube],
                          ["TikTok", business.tiktok],
                        ].map(([label, value]) =>
                          safeStr(value) ? (
                            <div key={String(label)}>
                              {label}: {safeStr(value)}
                            </div>
                          ) : null,
                        )}
                      </div>
                    </div>
                  ) : null}

                  <div className="pt-2 flex flex-wrap gap-2">
                    {claimMode ? (
                      <div className="w-full rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-white/75">
                        <div className="font-semibold text-yellow-200">
                          Claim mode active
                        </div>
                        <div className="mt-1">
                          You came here to claim an existing public listing.
                          Eligible businesses can continue directly into
                          Founding Membership.
                        </div>
                      </div>
                    ) : null}
                    {canClaim ? (
                      <Link
                        href={`/founding-membership?businessId=${encodeURIComponent(canonicalBusinessId)}`}
                        className="inline-flex items-center justify-center rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/12 px-4 py-2 text-sm font-bold text-[#F1D57A] transition hover:bg-[#D4AF37]/18"
                      >
                        Claim This Listing
                      </Link>
                    ) : (
                      <span className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-white/55">
                        {trust.verified ||
                        publicListingStatus === "ownership_verified"
                          ? "Ownership Verified"
                          : claimStage === "claim_initiated"
                            ? "Ownership verification pending"
                            : claimStage === "ownership_verification_pending"
                              ? "Ownership verification pending"
                              : claimStage === "additional_evidence_required"
                                ? "Ownership verification pending"
                                : claimStage === "disputed"
                                  ? "Ownership verification pending"
                                  : claimStage === "founding_growth_member"
                                    ? "Membership Already Active"
                                    : "Not Claimable"}
                      </span>
                    )}
                    {safeStr(business.primaryCtaLabel) &&
                    safeStr(business.primaryCtaUrl) ? (
                      <a
                        href={safeWebsite(business.primaryCtaUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-xl bg-[#D4AF37] px-4 py-2 text-sm font-extrabold text-black transition hover:bg-yellow-500"
                      >
                        {safeStr(business.primaryCtaLabel)}
                      </a>
                    ) : website ? (
                      <a
                        href={website}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() =>
                          trackFlowEvent({
                            eventType: "outbound_website_click",
                            businessAlias: alias,
                            source,
                          })
                        }
                        className="inline-flex items-center justify-center rounded-xl bg-[#D4AF37] px-4 py-2 text-sm font-extrabold text-black transition hover:bg-yellow-500"
                      >
                        Visit website
                      </a>
                    ) : null}
                    {safeStr(business.phone) && (
                      <a
                        href={`tel:${safeStr(business.phone).replace(/\s+/g, "")}`}
                        className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-white/80 transition hover:bg-white/[0.08]"
                      >
                        Call
                      </a>
                    )}
                    {mapQuery ? (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() =>
                          trackFlowEvent({
                            eventType: "directions_click",
                            businessAlias: alias,
                            source,
                          })
                        }
                        className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-white/80 transition hover:bg-white/[0.08]"
                      >
                        Directions
                      </a>
                    ) : null}
                  </div>

                  <div className="pt-2 text-xs text-white/60 space-y-2">
                    <div>Next actions</div>
                    <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-3 text-white/75">
                      <div className="font-semibold text-yellow-200">
                        Claim and membership path
                      </div>
                      <div className="mt-1">
                        Payment starts membership and opens ownership
                        verification, unless ownership has already been verified
                        through the existing verification review process.
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Link
                          href={
                            canClaim
                              ? `/founding-membership?businessId=${encodeURIComponent(canonicalBusinessId)}`
                              : "/founding-membership"
                          }
                          className="rounded-lg bg-yellow-500 px-3 py-2 text-xs font-extrabold text-black"
                        >
                          Start Membership and Claim
                        </Link>
                        <Link
                          href="/founding-membership/status"
                          className="rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-white/85"
                        >
                          View Member Status
                        </Link>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {categoryText ? (
                        <Link
                          href={`/business-directory?search=${encodeURIComponent(categoryText)}`}
                          className="rounded-lg border border-white/15 bg-white/[0.04] px-2.5 py-1 hover:bg-white/[0.08]"
                        >
                          Similar in {categoryText}
                        </Link>
                      ) : null}
                      {safeStr(business.state) ? (
                        <Link
                          href={`/business-directory?state=${encodeURIComponent(safeStr(business.state))}`}
                          className="rounded-lg border border-white/15 bg-white/[0.04] px-2.5 py-1 hover:bg-white/[0.08]"
                        >
                          More in {safeStr(business.state)}
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </aside>
              </div>

              {mapQuery && (
                <div className="border-t border-white/10 p-6 md:p-8">
                  <h3 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-white/80">
                    Find on map
                  </h3>
                  {locationText ? (
                    <p className="mb-3 text-xs text-white/55">{locationText}</p>
                  ) : null}
                  <div className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
                    <iframe
                      src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&hl=es;z=14&output=embed`}
                      width="100%"
                      height="280"
                      frameBorder="0"
                      style={{ border: 0 }}
                      allowFullScreen
                      title="Business location map"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async ({
  params,
}) => {
  const alias = Array.isArray(params?.alias)
    ? params.alias[0]
    : typeof params?.alias === "string"
      ? params.alias
      : null;

  if (!alias) {
    return {
      props: {
        initialAlias: null,
        initialBusiness: null,
        initialError: "Business not found.",
      },
    };
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const doc = await db.collection("businesses").findOne(
      { $or: [{ alias }, { slug: alias }] },
      {
        projection: {
          _id: 1,
          alias: 1,
          slug: 1,
          business_name: 1,
          businessName: 1,
          name: 1,
          shortSummary: 1,
          summary: 1,
          categories: 1,
          secondaryCategories: 1,
          category: 1,
          primaryCategory: 1,
          display_categories: 1,
          address: 1,
          streetAddress: 1,
          businessAddress: 1,
          city: 1,
          state: 1,
          serviceArea: 1,
          postalCode: 1,
          zip: 1,
          zipCode: 1,
          description: 1,
          phone: 1,
          businessPhone: 1,
          latitude: 1,
          longitude: 1,
          website: 1,
          image: 1,
          coverImage: 1,
          logo: 1,
          images: 1,
          galleryImages: 1,
          operatingHours: 1,
          hours: 1,
          offeringsSummary: 1,
          productsServicesSummary: 1,
          programsSummary: 1,
          tags: 1,
          specialties: 1,
          keywords: 1,
          social: 1,
          facebook: 1,
          instagram: 1,
          linkedin: 1,
          twitter: 1,
          youtube: 1,
          tiktok: 1,
          primaryCtaLabel: 1,
          primaryCtaUrl: 1,
          additionalCtas: 1,
          verified: 1,
          isVerified: 1,
          status: 1,
          claimStage: 1,
          claimLocked: 1,
          claimedByUserId: 1,
          claimedByEmail: 1,
          foundingMembershipId: 1,
          ownershipReviewStatus: 1,
          amountPaid: 1,
          completenessScore: 1,
          isComplete: 1,
          publicListingStatus: 1,
        },
      },
    );

    return {
      props: {
        initialAlias: alias,
        initialBusiness: doc ? normalizeBusinessDoc(doc) : null,
        initialError: doc ? "" : "Business not found.",
      },
    };
  } catch (error) {
    console.error("Failed to SSR business detail", error);
    return {
      props: {
        initialAlias: alias,
        initialBusiness: null,
        initialError: "Could not load this business. Please retry.",
      },
    };
  }
};
