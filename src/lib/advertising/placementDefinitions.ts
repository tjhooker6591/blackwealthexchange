import { getAdDurationOptions } from "@/lib/advertising/pricing";

export const FEATURED_JOB_TOP_CAP = 8;
export const FEATURED_SPONSOR_RAIL_CAP = 8;
export const DIRECTORY_FEATURED_CAP = 6;
// BANNER_HOMEPAGE_TOP_CAP still gates the dormant homepage-top code path
// in src/pages/api/advertising/public-placements.ts and
// src/pages/index.tsx -- that placement renders nothing today because no
// campaign has ever been sold against it, and is NOT a current
// buyer-facing placement (see PAID_PLACEMENT_DEFINITIONS below, which
// deliberately does not list it). Left in place because the dormant
// code path itself is intentionally untouched by this correction.
export const BANNER_HOMEPAGE_TOP_CAP = 1;
// BANNER_SIDEBAR_CAP (formerly 3) was removed 2026-09-07: the search-page
// sidebar (src/pages/api/advertising/public-placements.ts) has dynamic
// capacity, not a fixed business cap. See that file's comment for detail.

export type PlacementDefinition = {
  product: string;
  where: string;
  how: string;
  limits: string;
  duration: string;
  expiration: string;
};

function formatDurationPricing(optionId: string): string {
  const options = getAdDurationOptions(optionId);
  if (!options.length) return "See current pricing";
  return options
    .map((d) => `${d.durationDays} days ($${d.amountDollars})`)
    .join(" or ");
}

export const PAID_PLACEMENT_DEFINITIONS: PlacementDefinition[] = [
  {
    product: "Featured Job",
    where: "Job Listings page (/job-listings)",
    how: "Featured badge with featured-first ordering behavior",
    limits: `Max ${FEATURED_JOB_TOP_CAP} featured jobs shown as active featured at a time`,
    duration: "30 days",
    expiration: "featureEndDate window, then featured state auto-expires",
  },
  {
    product: "Featured Sponsor",
    where:
      "Homepage Featured Sponsors rail (primary homepage sponsorship surface)",
    how: "Scheduled sponsor cards from approved sponsor feed",
    limits: `Max ${FEATURED_SPONSOR_RAIL_CAP} visible sponsors in homepage rail`,
    duration: "7, 14, or 30 days",
    expiration: "Schedule/active-window filtering removes expired sponsors",
  },
  {
    product: "Featured Placement in Search Results",
    where:
      "Business Directory search-results area, shown directly within results above standard organic listings (option: directory-featured)",
    how: "Featured card with featured/sponsored labeling",
    limits: `Max ${DIRECTORY_FEATURED_CAP} featured cards shown at a time`,
    duration: formatDurationPricing("directory-featured"),
    expiration: "Active-window filtering removes expired placements",
  },
  {
    product: "Search Page Sidebar",
    where:
      "Business Directory / search-results sidebar (option: banner-ad, placement: sidebar)",
    how: "Approved banner creative rendered as a sidebar card",
    limits:
      "Dynamic -- shown to every visitor browsing the directory, not capped to a fixed small number of slots",
    duration: formatDurationPricing("banner-ad"),
    expiration: "Active-window filtering removes expired banner campaigns",
  },
  {
    product: "Custom Solution",
    where: "Scoped surfaces defined in approved campaign plan",
    how: "Request + approval + fulfillment defined before activation",
    limits: "No fixed global slot; scope is explicitly documented per plan",
    duration: "Plan-defined",
    expiration: "Plan-defined end date and fulfillment closeout",
  },
];
