import Link from "next/link";
import Image from "next/image";
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
      className="inline-flex items-center rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-sm font-semibold text-yellow-200 transition hover:bg-yellow-500/15"
    >
      {label}
    </a>
  );
}

function DetailCard({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="bwe-grid-card p-4">
      <div className="bwe-eyebrow">{label}</div>
      <div className="mt-1.5 text-sm leading-relaxed text-white/85">
        {value}
      </div>
    </div>
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
  ].filter(([, value]) => safe(value)) as [string, string][];

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

  const hasCtas =
    (safe(business.primaryCtaLabel) && safe(business.primaryCtaUrl)) ||
    (Array.isArray(business.additionalCtas) &&
      business.additionalCtas.length > 0);

  const galleryCount = Array.isArray(business.galleryImages)
    ? business.galleryImages.length
    : 0;

  return (
    <div className="bwe-shell-panel overflow-hidden rounded-3xl">
      {/* Cover image, or a gradient fallback so the header never looks bare */}
      <div className="relative h-40 w-full sm:h-56">
        {business.coverImage ? (
          <Image
            src={business.coverImage}
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{
              background:
                "radial-gradient(circle at top, rgba(212,175,55,0.16), transparent 55%), linear-gradient(180deg, rgba(12,15,23,0.9), rgba(7,9,14,0.9))",
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {business.logo ? (
          <div className="absolute -bottom-8 left-6 h-20 w-20 overflow-hidden rounded-2xl border-2 border-[var(--surface-0)] bg-[var(--surface-1)] shadow-lg sm:h-24 sm:w-24">
            <Image
              src={business.logo}
              alt=""
              width={96}
              height={96}
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}
      </div>

      <div
        className={
          business.logo ? "px-6 pb-6 pt-12 sm:pt-14" : "px-6 pb-6 pt-6"
        }
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="bwe-section-title">
              {safe(business.displayName) || "Unnamed business"}
            </h2>
            {categoryLine || locationLine ? (
              <p className="bwe-eyebrow mt-1.5">
                {[categoryLine, locationLine].filter(Boolean).join(" · ")}
              </p>
            ) : null}
          </div>
          {mode !== "public" && editHref ? (
            <Link
              href={editHref}
              className="inline-flex items-center rounded-full bg-yellow-500 px-4 py-2 text-sm font-bold text-black transition hover:bg-yellow-400"
            >
              Edit Business Info
            </Link>
          ) : null}
        </div>

        {safe(business.shortSummary) ? (
          <p className="bwe-lead mt-4">{business.shortSummary}</p>
        ) : null}
        {safe(business.description) ? (
          <p className="bwe-supporting-copy mt-2">{business.description}</p>
        ) : null}

        {hasCtas ? (
          <div className="mt-5 flex flex-wrap gap-2">
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
        ) : null}

        <div className="bwe-divider my-6" />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {showPrivateContactEmail && safe(business.publicEmail) ? (
            <DetailCard label="Email" value={business.publicEmail} />
          ) : null}
          {safe(business.phone) ? (
            <DetailCard label="Phone" value={business.phone} />
          ) : null}
          {website ? (
            <DetailCard
              label="Website"
              value={
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bwe-open-link"
                >
                  {business.website}
                </a>
              }
            />
          ) : null}
          {safe(business.streetAddress) ? (
            <DetailCard
              label="Address"
              value={
                [business.streetAddress, business.addressLine2, locationLine]
                  .filter(Boolean)
                  .join(", ") || business.streetAddress
              }
            />
          ) : null}
          {safe(business.serviceArea) ? (
            <DetailCard label="Service area" value={business.serviceArea} />
          ) : null}
          {safe(business.operatingHours) ? (
            <DetailCard
              label="Operating hours"
              value={business.operatingHours}
            />
          ) : null}
          {safe(business.offeringsSummary) ? (
            <DetailCard
              label="Products / Services"
              value={business.offeringsSummary}
            />
          ) : null}
          {Array.isArray(business.tags) && business.tags.length > 0 ? (
            <DetailCard
              label="Tags"
              value={
                <div className="flex flex-wrap gap-1.5">
                  {business.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-white/70"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              }
            />
          ) : null}
          {galleryCount > 0 ? (
            <DetailCard
              label="Gallery"
              value={`${galleryCount} image${galleryCount === 1 ? "" : "s"}`}
            />
          ) : null}
        </div>

        {socialEntries.length > 0 ? (
          <div className="mt-6">
            <div className="bwe-eyebrow">Social</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {socialEntries.map(([label, value]) => (
                <a
                  key={label}
                  href={websiteUrl(value)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bwe-soft-tile px-3 py-1.5 text-sm text-white/80 hover:text-yellow-200"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
