export const FEATURED_JOB_TOP_CAP = 8;
export const FEATURED_SPONSOR_RAIL_CAP = 8;
export const DIRECTORY_FEATURED_CAP = 6;
export const BANNER_HOMEPAGE_TOP_CAP = 1;
export const BANNER_SIDEBAR_CAP = 3;

export type PlacementDefinition = {
  product: string;
  where: string;
  how: string;
  limits: string;
  duration: string;
  expiration: string;
};

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
    product: "Directory Placement",
    where: "Business Directory featured placements section + listing tiers",
    how: "Featured cards above standard results with featured labeling",
    limits: `Max ${DIRECTORY_FEATURED_CAP} featured directory cards in featured block`,
    duration: "Typically 30 days (or approved campaign duration)",
    expiration: "Active-window filtering removes expired placements",
  },
  {
    product: "Banner Placement",
    where:
      "Business Directory sidebar banner + tightly limited homepage top banner",
    how: "Approved banner creatives rendered in slot-based placements",
    limits: `Homepage top: ${BANNER_HOMEPAGE_TOP_CAP} (deferred when Featured Sponsor campaigns are live); Directory sidebar: ${BANNER_SIDEBAR_CAP}`,
    duration: "14 or 30 days",
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
