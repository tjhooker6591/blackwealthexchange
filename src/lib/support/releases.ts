export type ReleaseLabel = "Available now" | "Improved" | "Foundation update";

export type ReleaseSection = {
  title: string;
  label: ReleaseLabel;
  bullets: string[];
};

export const releaseMeta = {
  releaseTitle: "BWE August 2026 Platform Status Update",
  releaseId: "BWE-2026.08",
  publishedDate: "August 8, 2026",
  lastUpdated: "August 8, 2026",
  status: "Improved" as const,
};

export const releaseSections: ReleaseSection[] = [
  {
    title: "Claim-ready directory flow",
    label: "Available now",
    bullets: [
      "Public business listings now show claim availability and verified ownership states more clearly.",
      "Eligible listings can start the Founding Verified Business Growth Membership claim path from the public directory.",
    ],
  },
  {
    title: "Ownership verification workflow",
    label: "Available now",
    bullets: [
      "Claim initiation, pending ownership review, and verified ownership states are now surfaced in the live listing flow.",
      "Payment and ownership verification are handled as separate states in the public claim journey.",
    ],
  },
  {
    title: "Founding membership launch path",
    label: "Available now",
    bullets: [
      "The Founding Verified Business Growth Membership is available at $49 per month with monthly billing.",
      "Checkout begins the claim and membership process, while ownership verification continues through manual review.",
    ],
  },
  {
    title: "Marketplace public accuracy",
    label: "Improved",
    bullets: [
      "Public marketplace listing, detail, homepage count, and shop overview routes now align to the same active owner-supplied catalog contract.",
      "Legacy expiry metadata no longer suppresses legitimate active products, while unpublished, deleted, and QA/test inventory remain excluded from the public marketplace.",
    ],
  },
  {
    title: "Support and release visibility",
    label: "Improved",
    bullets: [
      "Support includes a dedicated public release notes page for platform updates.",
      "Release information is aligned to currently verified live functionality only.",
    ],
  },
];

export const labelStyles: Record<ReleaseLabel, string> = {
  "Available now": "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  Improved: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  "Foundation update": "bg-sky-500/20 text-sky-300 border-sky-500/40",
};
