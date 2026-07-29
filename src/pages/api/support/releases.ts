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
  releaseTitle: "BWE July 2026 Platform Update",
  releaseId: "BWE-2026.07",
  publishedDate: "July 28, 2026",
  lastUpdated: "July 28, 2026, 9:29 PM PT",
  status: "Available now",
  items: [
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
      title: "Marketplace public inventory",
      label: "Available now",
      bullets: [
        "Three marketplace products are currently available through the public marketplace and product detail routes.",
        "Public marketplace pages now emphasize seller identity, availability, and buyer support paths.",
      ],
    },
    {
      title: "Support and release visibility",
      label: "Improved",
      bullets: [
        "Support includes a dedicated release notes page for public platform updates.",
        "Release information is now aligned to currently verified live functionality only.",
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
