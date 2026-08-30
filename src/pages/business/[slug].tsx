import fs from "node:fs";
import path from "node:path";
import { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import ErrorPage from "next/error";
import { canonicalUrl, truncateMeta } from "@/lib/seo";
import clientPromise from "@/lib/mongodb";
import {
  normalizeFoundingClaimStage,
  resolveFoundingOwnershipState,
} from "@/lib/founding-membership-state";
import { Spotlight, spotlightData } from "../../lib/SpotlightEntry";
import { sanitizeRichHtml } from "@/lib/security/sanitizeHtml";
import {
  mapDirectoryProfileFromDoc,
  normalizeDirectoryLocationParts,
} from "@/lib/directoryProfileContract";
import {
  buildBusinessDirectionsUrl,
  getBusinessMediaSet,
} from "@/lib/directoryPublicMedia";

type BusinessEntry = {
  claimStage: string | null;
  publicListingStatus: string | null;
  canClaim: boolean;
  name: string;
  imageSrc: string | null;
  logoSrc: string | null;
  galleryImages: string[];
  story: string;
  summary: string | null;
  offeringsSummary: string | null;
  operatingHours: string | null;
  serviceArea: string | null;
  tags: string[];
  primaryCtaLabel: string | null;
  primaryCtaUrl: string | null;
  details: string | null;
  category: string | null;
  categoriesText: string | null;
  location: string | null;
  address: string | null;
  website: string | null;
  phone: string | null;
  social: Array<{ label: string; url: string }>;
  sourceUrl: string | null;
  status: string | null;
  isSponsored: boolean;
  isStrongProfile: boolean;
  directionsUrl: string | null;
  reference: string | null;
};

interface Props {
  entry: BusinessEntry | null;
  slug: string;
  businessId: string | null;
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function mapDbBusinessToEntry(doc: any): BusinessEntry {
  const profile = mapDirectoryProfileFromDoc(doc);
  const name = cleanString(profile.displayName) || "Business";
  const media = getBusinessMediaSet({
    ...doc,
    coverImage: profile.coverImage,
    logo: profile.logo,
    galleryImages: profile.galleryImages,
  });
  const galleryImages = media.galleryImages;
  const imageSrc = cleanString(media.primaryImage);

  const description =
    cleanString(profile.description) ||
    `${name} is listed on Black Wealth Exchange.`;

  const website = cleanString(profile.website);
  const category = cleanString(profile.primaryCategory);
  const categoriesText = cleanString(
    [
      profile.primaryCategory,
      Array.isArray(profile.secondaryCategories)
        ? profile.secondaryCategories.join(" • ")
        : "",
    ]
      .filter(Boolean)
      .join(" • "),
  );
  const locationParts = normalizeDirectoryLocationParts(doc);
  const location = locationParts.fullAddress;
  const status =
    cleanString(doc?.status || doc?.trustStatus).toLowerCase() || null;
  const claimStage = normalizeFoundingClaimStage(doc?.claimStage);
  const ownershipState = resolveFoundingOwnershipState({
    business: doc,
    claimStage: doc?.claimStage,
    ownershipReviewStatus: doc?.ownershipReviewStatus,
    publicListingStatus: doc?.publicListingStatus,
  });
  const publicListingStatus = ownershipState.publicListingStatus;
  const isSponsored = Number(doc?.amountPaid || 0) > 0;
  const isStrongProfile =
    doc?.isComplete === true ||
    Number(doc?.qualityScore || 0) >= 70 ||
    Number(doc?.completenessScore || 0) >= 70;
  const directionsUrl = buildBusinessDirectionsUrl({
    ...doc,
    streetAddress: locationParts.streetAddress,
    addressLine2: locationParts.addressLine2,
    city: locationParts.city,
    state: locationParts.state,
    postalCode: locationParts.postalCode,
  });
  const detailParts: string[] = [];
  if (category)
    detailParts.push(`<p><strong>Category:</strong> ${category}</p>`);
  if (location)
    detailParts.push(`<p><strong>Location:</strong> ${location}</p>`);
  if (website)
    detailParts.push(
      `<p><strong>Website:</strong> <a href="${website}" target="_blank" rel="noreferrer">${website}</a></p>`,
    );
  if (cleanString(profile.serviceArea))
    detailParts.push(
      `<p><strong>Service area:</strong> ${cleanString(profile.serviceArea)}</p>`,
    );
  if (cleanString(profile.operatingHours))
    detailParts.push(
      `<p><strong>Hours:</strong> ${cleanString(profile.operatingHours)}</p>`,
    );

  const socialEntries = [
    ["Facebook", cleanString(profile.facebook)],
    ["Instagram", cleanString(profile.instagram)],
    ["LinkedIn", cleanString(profile.linkedin)],
    ["Twitter / X", cleanString(profile.twitter)],
    ["YouTube", cleanString(profile.youtube)],
    ["TikTok", cleanString(profile.tiktok)],
  ]
    .filter(([, url]) => url)
    .map(([label, url]) => ({ label: String(label), url: String(url) }));

  return {
    name,
    imageSrc: imageSrc || null,
    logoSrc: cleanString(media.logo) || null,
    galleryImages,
    story: description,
    summary: cleanString(profile.shortSummary) || null,
    offeringsSummary: cleanString(profile.offeringsSummary) || null,
    operatingHours: cleanString(profile.operatingHours) || null,
    serviceArea: cleanString(profile.serviceArea) || null,
    tags: Array.isArray(profile.tags) ? profile.tags : [],
    primaryCtaLabel: cleanString(profile.primaryCtaLabel) || null,
    primaryCtaUrl: cleanString(profile.primaryCtaUrl) || null,
    details: sanitizeRichHtml(detailParts.join("")) || null,
    category: category || null,
    categoriesText: categoriesText || null,
    location: location || null,
    address: location || locationParts.streetAddress || null,
    website: website || null,
    phone: cleanString(profile.phone) || null,
    social: socialEntries,
    sourceUrl: cleanString(doc?.sourceUrl || doc?.source) || null,
    status,
    claimStage,
    publicListingStatus,
    canClaim:
      publicListingStatus !== "ownership_verified" &&
      ![
        "claim_initiated",
        "ownership_verification_pending",
        "additional_evidence_required",
        "disputed",
        "founding_growth_member",
        "ownership_verified",
      ].includes(claimStage || "") &&
      status !== "verified",
    isSponsored,
    isStrongProfile,
    directionsUrl,
    reference:
      cleanString(doc?.source || doc?.sourceUrl || doc?.placeId) || null,
  };
}

function loadFallbackBusinessBySlug(slug: string): BusinessEntry | null {
  try {
    const filePath = path.join(
      process.cwd(),
      "data",
      "black_owned_geocoded.json",
    );
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;

    const hit = parsed.find((item: any) => {
      const alias = cleanString(item?.alias || item?.slug);
      return alias === slug;
    });

    if (!hit) return null;

    return mapDbBusinessToEntry({
      business_name: hit.business_name,
      description: hit.description,
      website: hit.website,
      category: hit.category || hit.display_categories,
      image: hit.image,
      images: hit.images,
      city: hit.city,
      state: hit.state,
      address: hit.address,
    });
  } catch {
    return null;
  }
}

const BusinessDetail: NextPage<Props> = ({ entry, slug, businessId }) => {
  if (!entry) {
    return <ErrorPage statusCode={404} />;
  }

  const title = `${entry.name} | Black Business Directory | Black Wealth Exchange`;
  const description = truncateMeta(
    entry.story ||
      `${entry.name} is listed on Black Wealth Exchange. Explore business details and trusted directory information.`,
  );
  const canonical = canonicalUrl(`/business/${encodeURIComponent(slug)}`);
  const image = entry.imageSrc;
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: entry.name,
    description,
    image: image || undefined,
    url: canonical,
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        {image ? <meta property="og:image" content={image} /> : null}
        <meta
          name="twitter:card"
          content={image ? "summary_large_image" : "summary"}
        />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        {image ? <meta name="twitter:image" content={image} /> : null}
      </Head>
      <script type="application/ld+json">
        {JSON.stringify(localBusinessSchema)}
      </script>
      <main className="min-h-screen bg-black text-white">
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-yellow-500/10 via-transparent to-transparent pointer-events-none" />
        <section className="relative max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] p-4 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 sm:gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-300 leading-tight">
                  {entry.name}
                </h1>
                <div className="mt-1 sm:mt-2 text-white/70 text-sm sm:text-base">
                  {entry.location || ""}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
                  {entry.category ? (
                    <span className="text-[11px] sm:text-xs rounded-full border border-yellow-400/30 bg-yellow-500/10 px-2.5 py-0.5 sm:px-3 sm:py-1 text-yellow-200">
                      {entry.category}
                    </span>
                  ) : null}
                  {entry.publicListingStatus === "ownership_verified" ? (
                    <span className="text-[11px] sm:text-xs rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-0.5 sm:px-3 sm:py-1 text-emerald-200">
                      Ownership Verified
                    </span>
                  ) : entry.claimStage === "ownership_verification_pending" ||
                    entry.claimStage === "claim_initiated" ||
                    entry.claimStage === "additional_evidence_required" ||
                    entry.claimStage === "disputed" ? (
                    <span className="text-[11px] sm:text-xs rounded-full border border-sky-400/30 bg-sky-500/10 px-2.5 py-0.5 sm:px-3 sm:py-1 text-sky-200">
                      Ownership verification pending
                    </span>
                  ) : !entry.isSponsored ? (
                    <span className="text-[11px] sm:text-xs rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 sm:px-3 sm:py-1 text-white/80">
                      Unclaimed public listing
                    </span>
                  ) : (
                    <span className="text-[11px] sm:text-xs rounded-full border border-yellow-400/30 bg-yellow-500/10 px-2.5 py-0.5 sm:px-3 sm:py-1 text-yellow-200">
                      Sponsored
                    </span>
                  )}
                  {entry.status === "verified" ? (
                    <span className="text-[11px] sm:text-xs rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-0.5 sm:px-3 sm:py-1 text-emerald-200">
                      Owner Verified
                    </span>
                  ) : null}
                  {entry.isStrongProfile ? (
                    <span className="text-[11px] sm:text-xs rounded-full border border-indigo-400/30 bg-indigo-500/10 px-2.5 py-0.5 sm:px-3 sm:py-1 text-indigo-200">
                      Strong Profile
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:flex gap-2 w-full md:w-auto">
                {entry.canClaim ? (
                  <Link
                    href={
                      businessId
                        ? `/founding-membership?businessId=${encodeURIComponent(businessId)}`
                        : "/founding-membership"
                    }
                    className="inline-flex items-center justify-center rounded-xl bg-yellow-500 text-black font-semibold text-sm px-3 py-2 hover:bg-yellow-400 transition"
                  >
                    Claim This Listing
                  </Link>
                ) : (
                  <span className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/60">
                    {entry.publicListingStatus === "ownership_verified"
                      ? "Ownership verified"
                      : "Ownership verification pending"}
                  </span>
                )}
                {entry.publicListingStatus !== "ownership_verified" ? (
                  <Link
                    href="/founding-membership/status"
                    className="inline-flex items-center justify-center rounded-xl border border-yellow-500/35 bg-yellow-500/10 text-yellow-200 font-semibold text-sm px-3 py-2 hover:bg-yellow-500/15 transition"
                  >
                    Claim Status
                  </Link>
                ) : null}
                {entry.primaryCtaLabel && entry.primaryCtaUrl ? (
                  <a
                    href={entry.primaryCtaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm px-3 py-2 transition"
                  >
                    {entry.primaryCtaLabel}
                  </a>
                ) : entry.website ? (
                  <a
                    href={entry.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm px-3 py-2 transition"
                  >
                    Visit website
                  </a>
                ) : null}
                {entry.directionsUrl ? (
                  <a
                    href={entry.directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm px-3 py-2 transition"
                  >
                    Directions
                  </a>
                ) : null}
              </div>
            </div>

            <div className="mt-4 sm:mt-6 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              <div className="md:col-span-2 rounded-2xl border border-white/10 bg-black/30 p-5">
                {entry.imageSrc ? (
                  <div className="relative w-full h-72 rounded-xl overflow-hidden mb-4">
                    <Image
                      src={entry.imageSrc}
                      alt={entry.name}
                      fill
                      style={{ objectFit: "cover" }}
                      priority
                    />
                  </div>
                ) : null}
                <div className="text-sm font-semibold text-white/90 mb-2">
                  About
                </div>
                {entry.summary ? (
                  <div className="text-white/80 text-sm mb-2">
                    {entry.summary}
                  </div>
                ) : null}
                {entry.categoriesText ? (
                  <div className="text-white/60 text-sm mb-2">
                    {entry.categoriesText}
                  </div>
                ) : null}
                <div className="text-white/75 leading-relaxed">
                  {entry.story || "Business details are being expanded."}
                </div>
                {entry.offeringsSummary ? (
                  <div className="mt-4">
                    <div className="text-sm font-semibold text-white/90 mb-2">
                      Products and services
                    </div>
                    <div className="text-white/75 leading-relaxed">
                      {entry.offeringsSummary}
                    </div>
                  </div>
                ) : null}
                {entry.tags.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {entry.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-3">
                <div className="text-sm font-semibold text-white/90">
                  Claim and membership path
                </div>
                <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-white/75">
                  <div className="font-semibold text-yellow-200">
                    {entry.canClaim
                      ? "Claim This Listing"
                      : entry.publicListingStatus === "ownership_verified"
                        ? "Ownership Verified"
                        : "Ownership verification pending"}
                  </div>
                  <div className="mt-2">
                    {entry.canClaim
                      ? "If this is your listing, start the Founding Verified Business Growth Membership claim path to open ownership verification, profile review, fulfillment, and monthly reporting."
                      : entry.publicListingStatus === "ownership_verified"
                        ? "This listing has already completed ownership verification and listing-management access has been activated for the verified owner."
                        : "A founding membership is already active for this listing and ownership verification is still pending. Another claim or payment is not available while review is in progress."}
                  </div>
                  <div className="mt-2 text-white/60">
                    Payment and ownership verification are separate states.
                    Payment does not automatically verify ownership.
                  </div>
                  <div className="mt-2 text-white/80">
                    {entry.canClaim
                      ? "This listing is available for a new claim."
                      : entry.publicListingStatus === "ownership_verified"
                        ? "This listing is not claimable because ownership is already verified."
                        : "Ownership verification pending"}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {entry.canClaim ? (
                      <Link
                        href={
                          businessId
                            ? `/founding-membership?businessId=${encodeURIComponent(businessId)}`
                            : "/founding-membership"
                        }
                        className="rounded-lg bg-yellow-500 px-3 py-2 text-xs font-extrabold text-black"
                      >
                        Start Membership and Claim Listing
                      </Link>
                    ) : (
                      <span className="rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-white/70">
                        {entry.publicListingStatus === "ownership_verified"
                          ? "Ownership verified"
                          : "Ownership verification pending"}
                      </span>
                    )}
                    {entry.publicListingStatus !== "ownership_verified" ? (
                      <Link
                        href="/founding-membership/status"
                        className="rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-white/85"
                      >
                        View Member Status
                      </Link>
                    ) : null}
                  </div>
                </div>
                <div className="text-sm font-semibold text-white/90">
                  Details
                </div>
                {entry.details ? (
                  <div
                    className="text-sm text-white/75"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeRichHtml(entry.details),
                    }}
                  />
                ) : (
                  <div className="text-sm text-white/60">
                    No additional details yet.
                  </div>
                )}
                {entry.social.length ? (
                  <div className="pt-3 space-y-1 text-sm text-white/75">
                    <div className="font-semibold text-white/90">Social</div>
                    {entry.social.map((item) => (
                      <div key={`${item.label}-${item.url}`}>
                        {item.label}: {item.url}
                      </div>
                    ))}
                  </div>
                ) : null}
                {entry.operatingHours ? (
                  <div className="pt-3 text-sm text-white/75">
                    <div className="font-semibold text-white/90">Hours</div>
                    <div>{entry.operatingHours}</div>
                  </div>
                ) : null}
                {entry.serviceArea ? (
                  <div className="pt-3 text-sm text-white/75">
                    <div className="font-semibold text-white/90">
                      Service Area
                    </div>
                    <div>{entry.serviceArea}</div>
                  </div>
                ) : null}
                {entry.reference ? (
                  <div className="text-xs text-white/50 pt-2">
                    Reference: {entry.reference}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async ({
  params,
}) => {
  const slug = String(params?.slug || "").trim();
  if (!slug) return { notFound: true };

  const spotlight = (spotlightData as Spotlight[]).find(
    (item) => item.slug === slug,
  );
  if (spotlight) {
    return {
      props: {
        entry: {
          name: spotlight.name,
          imageSrc: cleanString(spotlight.imageSrc) || null,
          logoSrc: null,
          galleryImages: [],
          story:
            cleanString(spotlight.story) ||
            `${cleanString(spotlight.name) || "Business"} is listed on Black Wealth Exchange.`,
          summary: null,
          offeringsSummary: null,
          operatingHours: null,
          serviceArea: null,
          tags: [],
          primaryCtaLabel: null,
          primaryCtaUrl: null,
          details: cleanString(spotlight.details) || null,
          category: null,
          location: null,
          website: null,
          phone: null,
          social: [],
          sourceUrl: null,
          categoriesText: null,
          address: null,
          status: null,
          claimStage: null,
          publicListingStatus: null,
          canClaim: true,
          isSponsored: false,
          isStrongProfile: false,
          directionsUrl: null,
          reference: null,
        },
        slug,
        businessId: null,
      },
    };
  }

  try {
    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB?.trim();
    const db = dbName ? client.db(dbName) : client.db();

    const doc = await db.collection("businesses").findOne(
      {
        $or: [{ slug }, { alias: slug }],
        status: { $nin: ["rejected", "archived"] },
      },
      {
        projection: {
          business_name: 1,
          businessName: 1,
          name: 1,
          shortSummary: 1,
          summary: 1,
          description: 1,
          image: 1,
          logo: 1,
          images: 1,
          galleryImages: 1,
          website: 1,
          phone: 1,
          businessPhone: 1,
          sourceUrl: 1,
          source: 1,
          category: 1,
          primaryCategory: 1,
          categories: 1,
          secondaryCategories: 1,
          display_categories: 1,
          city: 1,
          state: 1,
          zip: 1,
          postalCode: 1,
          zipCode: 1,
          address: 1,
          streetAddress: 1,
          businessAddress: 1,
          addressLine1: 1,
          addressLine2: 1,
          suite: 1,
          unit: 1,
          serviceArea: 1,
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
          status: 1,
          trustStatus: 1,
          amountPaid: 1,
          isComplete: 1,
          qualityScore: 1,
          completenessScore: 1,
          placeId: 1,
          claimStage: 1,
          claimLocked: 1,
          claimedByUserId: 1,
          claimedByEmail: 1,
          foundingMembershipId: 1,
          ownershipReviewStatus: 1,
        },
      },
    );

    if (!doc) {
      const fallback = loadFallbackBusinessBySlug(slug);
      if (!fallback) return { notFound: true };
      return { props: { entry: fallback, slug, businessId: null } };
    }

    return {
      props: {
        entry: mapDbBusinessToEntry(doc),
        slug,
        businessId: doc?._id ? String(doc._id) : null,
      },
    };
  } catch {
    const fallback = loadFallbackBusinessBySlug(slug);
    if (!fallback) return { notFound: true };
    return { props: { entry: fallback, slug, businessId: null } };
  }
};

export default BusinessDetail;
