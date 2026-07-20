import Link from "next/link";
import React from "react";
import type { DirectoryProfileData } from "@/lib/directoryProfileContract";

export type BusinessProfileContentMode = "public" | "owner" | "preview";

export type BusinessProfileContentProps = {
  business: DirectoryProfileData & { id?: string };
  mode?: BusinessProfileContentMode;
  showPrivateContactEmail?: boolean;
  editHref?: string | null;
};

function safe(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function websiteUrl(value: unknown) {
  const raw = safe(value);
  if (!raw) return "";
  if (/^(https?:\/\/|\/)/i.test(raw)) return raw;
  return `https://${raw}`;
}

function renderCta(label: string, url: string, index: number) {
  if (!label || !url) return null;
  return (
    <a
      key={`${label}-${index}`}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1.5 text-sm text-yellow-200 hover:bg-yellow-500/15"
    >
      {label}
    </a>
  );
}

export default function BusinessProfileContent({
  business,
  mode = "public",
  showPrivateContactEmail = false,
  editHref,
}: BusinessProfileContentProps) {
  const website = websiteUrl(business.website);
  const socialEntries = [
    ["Facebook", business.facebook],
    ["Instagram", business.instagram],
    ["LinkedIn", business.linkedin],
    ["Twitter / X", business.twitter],
    ["YouTube", business.youtube],
    ["TikTok", business.tiktok],
  ].filter(([, value]) => safe(value));

  const categoryLine = [
    safe(business.primaryCategory),
    Array.isArray(business.secondaryCategories)
      ? business.secondaryCategories.filter(Boolean).join(", ")
      : "",
  ]
    .filter(Boolean)
    .join(" • ");

  const locationLine = [business.city, business.state, business.postalCode]
    .map((value) => safe(value))
    .filter(Boolean)
    .join(", ");

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-5">
      <p>
        <strong>Name:</strong> {safe(business.displayName) || "—"}
      </p>
      {safe(business.shortSummary) ? (
        <p>
          <strong>Summary:</strong> {business.shortSummary}
        </p>
      ) : null}
      {safe(business.description) ? (
        <p>
          <strong>Description:</strong> {business.description}
        </p>
      ) : null}
      {showPrivateContactEmail ? (
        <p>
          <strong>Email:</strong> {safe(business.publicEmail) || "—"}
        </p>
      ) : null}
      {safe(business.phone) ? (
        <p>
          <strong>Phone:</strong> {business.phone}
        </p>
      ) : null}
      {website ? (
        <p>
          <strong>Website:</strong> {website}
        </p>
      ) : null}
      {safe(business.streetAddress) ? (
        <p>
          <strong>Address:</strong> {business.streetAddress}
        </p>
      ) : null}
      {locationLine ? (
        <p>
          <strong>Location:</strong> {locationLine}
        </p>
      ) : null}
      {safe(business.serviceArea) ? (
        <p>
          <strong>Service Area:</strong> {business.serviceArea}
        </p>
      ) : null}
      {categoryLine ? (
        <p>
          <strong>Categories:</strong> {categoryLine}
        </p>
      ) : null}
      {safe(business.operatingHours) ? (
        <p>
          <strong>Operating hours:</strong> {business.operatingHours}
        </p>
      ) : null}
      {safe(business.offeringsSummary) ? (
        <p>
          <strong>Products / Services:</strong> {business.offeringsSummary}
        </p>
      ) : null}
      {Array.isArray(business.tags) && business.tags.length > 0 ? (
        <p>
          <strong>Tags:</strong> {business.tags.join(", ")}
        </p>
      ) : null}
      {socialEntries.length > 0 ? (
        <div>
          <strong>Social links:</strong>
          <ul className="mt-2 space-y-1">
            {socialEntries.map(([label, value]) => (
              <li key={String(label)}>
                {label}: {value}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {(safe(business.primaryCtaLabel) && safe(business.primaryCtaUrl)) ||
      (Array.isArray(business.additionalCtas) &&
        business.additionalCtas.length > 0) ? (
        <div>
          <strong>Calls to action:</strong>
          <div className="mt-2 flex flex-wrap gap-2">
            {safe(business.primaryCtaLabel) && safe(business.primaryCtaUrl)
              ? renderCta(
                  business.primaryCtaLabel!,
                  websiteUrl(business.primaryCtaUrl),
                  0,
                )
              : null}
            {Array.isArray(business.additionalCtas)
              ? business.additionalCtas.map((cta, index) =>
                  cta?.label && cta?.url
                    ? renderCta(cta.label, websiteUrl(cta.url), index + 1)
                    : null,
                )
              : null}
          </div>
        </div>
      ) : null}
      {business.logo ||
      business.coverImage ||
      (Array.isArray(business.galleryImages) &&
        business.galleryImages.length > 0) ? (
        <div>
          <strong>Media:</strong>
          <ul className="mt-2 space-y-1 text-sm text-white/80">
            {business.logo ? <li>Logo: {business.logo}</li> : null}
            {business.coverImage ? (
              <li>Cover image: {business.coverImage}</li>
            ) : null}
            {Array.isArray(business.galleryImages) &&
            business.galleryImages.length > 0 ? (
              <li>Gallery images: {business.galleryImages.length}</li>
            ) : null}
          </ul>
        </div>
      ) : null}
      {mode !== "public" && editHref ? (
        <Link
          href={editHref}
          className="inline-block mt-4 bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-400 transition"
        >
          Edit Business Info
        </Link>
      ) : null}
    </div>
  );
}
