type ReleaseLabel = "Available now" | "Improved" | "Foundation update";

type ReleaseSection = {
  title: string;
  label: ReleaseLabel;
  bullets: string[];
};

const staticReleasePayload: {
  ok: true;
  source: "static";
  generatedAt: string;
  releaseTitle: string;
  releaseId: string;
  publishedDate: string;
  lastUpdated: string;
  status: ReleaseLabel;
  items: ReleaseSection[];
} = {
  ok: true,
  source: "static",
  generatedAt: new Date().toISOString(),
  releaseTitle: "BWE May 2026 Platform Update",
  releaseId: "BWE-2026.05",
  publishedDate: "May 12, 2026",
  lastUpdated: "May 12, 2026, 11:30 AM PT",
  status: "Available now",
  items: [
    {
      title: "Search & Directory improvements",
      label: "Improved",
      bullets: [
        "Better search quality and consistency across business directory views.",
        "Directory browsing now has more reliable result rendering.",
      ],
    },
    {
      title: "Marketplace stability improvements",
      label: "Improved",
      bullets: [
        "Order and product flows are now more stable across common user paths.",
        "Checkout and seller workflows received reliability-focused updates.",
      ],
    },
    {
      title: "Support experience improvements",
      label: "Available now",
      bullets: [
        "Support routes and ticket surfaces were tightened for better consistency.",
        "Release notes now have a dedicated user-facing page in Support.",
      ],
    },
    {
      title: "Wealth Builder foundation updates",
      label: "Foundation update",
      bullets: [
        "Core Wealth Builder APIs and auth/entitlement plumbing were expanded.",
        "Budget, debt, goals, insights, and transaction foundations are in place.",
      ],
    },
    {
      title: "Travel Map foundation updates",
      label: "Foundation update",
      bullets: [
        "Travel Map API and page scaffolding expanded for upcoming user features.",
        "Saved and nearby experience foundations were added for future releases.",
      ],
    },
    {
      title: "Sponsor & Business Image reliability improvements",
      label: "Improved",
      bullets: [
        "Fallback image handling was improved for business and sponsor content.",
        "Image loading reliability was strengthened across key pages.",
      ],
    },
    {
      title: "Security/session/runtime stability improvements",
      label: "Improved",
      bullets: [
        "Session and runtime guardrails were hardened in core app paths.",
        "Security-related route protections were reinforced for stability.",
      ],
    },
  ],
};

const err = (res: any, c: number, code: string, message: string) =>
  res.status(c).json({ ok: false, code, message });

export default function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return err(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed");
  }

  return res.status(200).json(staticReleasePayload);
}
