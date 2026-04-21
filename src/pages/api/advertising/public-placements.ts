import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import {
  BANNER_HOMEPAGE_TOP_CAP,
  BANNER_SIDEBAR_CAP,
  DIRECTORY_FEATURED_CAP,
} from "@/lib/advertising/placementDefinitions";

type PublicPlacement = {
  id: string;
  option: string;
  placement: string;
  name: string;
  tagline: string;
  image: string;
  targetUrl: string;
  startsAt: string | null;
  endsAt: string | null;
  durationDays: number;
};

function s(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function isHttpUrl(v: string) {
  return /^https?:\/\//i.test(v);
}

function normalizeUrl(v: string) {
  const raw = s(v);
  if (!raw) return "";
  if (isHttpUrl(raw)) return raw;
  if (raw.startsWith("/")) return raw;
  return `https://${raw}`;
}

function toDate(v: unknown): Date | null {
  if (!v) return null;
  const d = new Date(v as any);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isActiveWindow(paidAt: Date | null, durationDays: number, now: Date) {
  if (!paidAt) return false;
  const endsAt = new Date(
    paidAt.getTime() + durationDays * 24 * 60 * 60 * 1000,
  );
  return paidAt <= now && now < endsAt;
}

function mapPlacement(doc: any, now: Date): PublicPlacement | null {
  const option = s(doc?.option);
  const placement = s(doc?.placement || doc?.placementType);
  const name = s(doc?.business) || "Sponsored";
  const tagline =
    s(doc?.details).slice(0, 120) || "Paid placement on Black Wealth Exchange";
  const image = s(doc?.adImage) || "/default-image.jpg";
  const targetUrl = normalizeUrl(s(doc?.targetUrl || doc?.website));
  const durationDays = Number.isFinite(Number(doc?.durationDays))
    ? Math.max(1, Math.floor(Number(doc?.durationDays)))
    : 30;
  const paidAt = toDate(doc?.paidAt);
  if (!isActiveWindow(paidAt, durationDays, now)) return null;

  const endsAt = paidAt
    ? new Date(paidAt.getTime() + durationDays * 24 * 60 * 60 * 1000)
    : null;

  return {
    id: String(doc?._id || ""),
    option,
    placement,
    name,
    tagline,
    image,
    targetUrl: targetUrl || "#",
    startsAt: paidAt ? paidAt.toISOString() : null,
    endsAt: endsAt ? endsAt.toISOString() : null,
    durationDays,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const now = new Date();

    const docs = await db
      .collection("advertising_requests")
      .find({
        option: {
          $in: ["banner-ad", "directory-featured", "directory-standard"],
        },
        paymentStatus: "paid",
        reviewStatus: "approved",
        status: { $in: ["approved", "active"] },
      })
      .sort({ paidAt: -1, updatedAt: -1, createdAt: -1 })
      .limit(120)
      .toArray();

    const mapped = docs
      .map((d) => mapPlacement(d, now))
      .filter(Boolean) as PublicPlacement[];

    const bannerHomepageTop = mapped
      .filter((x) => x.option === "banner-ad" && x.placement === "homepage-top")
      .slice(0, BANNER_HOMEPAGE_TOP_CAP);

    const bannerSidebar = mapped
      .filter((x) => x.option === "banner-ad" && x.placement === "sidebar")
      .slice(0, BANNER_SIDEBAR_CAP);

    const directoryFeatured = mapped
      .filter((x) => x.option === "directory-featured")
      .slice(0, DIRECTORY_FEATURED_CAP);

    return res.status(200).json({
      ok: true,
      placements: {
        bannerHomepageTop,
        bannerSidebar,
        directoryFeatured,
      },
      caps: {
        bannerHomepageTop: BANNER_HOMEPAGE_TOP_CAP,
        bannerSidebar: BANNER_SIDEBAR_CAP,
        directoryFeatured: DIRECTORY_FEATURED_CAP,
      },
      generatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("[/api/advertising/public-placements]", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
