import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { ObjectId } from "mongodb";
import { weekStartUtc } from "@/lib/advertising/sponsorSchedule";

type SponsorCard = {
  _id: string;
  name: string;
  tagline: string;
  img: string;
  url: string;
  cta: string;
  tier?: string;
  featuredSlot?: number | null;
  source: "featured_sponsor_schedule" | "directory_listings" | "businesses";
  weekStart?: string | null;
  queueStatus?: string | null;
};

function s(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function normalizeBusinessUrl(raw: string, name?: string) {
  const v = s(raw);
  const fallback = `/business-directory?search=${encodeURIComponent(s(name) || "sponsor")}`;
  if (!v || v === "/" || v === "#") return fallback;

  if (/^https?:\/\//i.test(v)) {
    try {
      const u = new URL(v);
      if (!u.hostname) return fallback;
      return v;
    } catch {
      return fallback;
    }
  }

  if (v.startsWith("/")) return v;

  try {
    const withProto = `https://${v}`;
    const u = new URL(withProto);
    if (!u.hostname) return fallback;
    return withProto;
  } catch {
    return fallback;
  }
}

function safeSponsorImage(raw: string) {
  const v = s(raw);
  if (!v) return "/house-draft.jpg";
  if (v.startsWith("/")) return v;

  try {
    const u = new URL(v);
    if (u.hostname === "example.com" || u.hostname.endsWith(".example.com")) {
      return "/house-draft.jpg";
    }
    // Defensive default: keep homepage stable unless source is explicitly local.
    return "/house-draft.jpg";
  } catch {
    return "/house-draft.jpg";
  }
}

function asObjectId(id: string): ObjectId | null {
  if (!id || !ObjectId.isValid(id)) return null;
  return new ObjectId(id);
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
    const weekParam = s(req.query.weekStart);
    const weekInput = weekParam ? new Date(weekParam) : now;
    const currentWeek = weekStartUtc(
      Number.isNaN(weekInput.getTime()) ? now : weekInput,
    );

    const scheduled = await db
      .collection("featured_sponsor_schedule")
      .find({
        placement: "homepage-featured-sponsor",
        weekStart: currentWeek,
        status: { $in: ["scheduled", "active"] },
      })
      .sort({ queueStatus: 1, createdAt: 1 })
      .limit(12)
      .toArray();

    if (scheduled.length) {
      const cards: SponsorCard[] = scheduled.map((row: any, i: number) => ({
        _id: String(row.campaignId || row._id),
        name: s(row.businessName) || "Featured Sponsor",
        tagline:
          s(row.tagline).slice(0, 90) || "Featured on Black Wealth Exchange",
        img: safeSponsorImage(s(row.creativeUrl)),
        url: normalizeBusinessUrl(
          s(row.targetUrl || row.website),
          s(row.businessName),
        ),
        cta: "Learn More",
        tier: "featured-sponsor",
        featuredSlot: i + 1,
        source: "featured_sponsor_schedule",
        weekStart: row.weekStart ? new Date(row.weekStart).toISOString() : null,
        queueStatus: s(row.queueStatus) || null,
      }));
      return res.status(200).json({ ok: true, sponsors: cards });
    }

    const listings = await db
      .collection("directory_listings")
      .find({
        listingStatus: "active",
        tier: "featured",
        paymentStatus: "paid",
        $or: [{ featuredEndDate: { $gt: now } }, { expiresAt: { $gt: now } }],
      })
      .sort({ featuredSlot: 1, paidAt: -1 })
      .limit(20)
      .toArray();

    const businessIds = listings
      .map((l: any) => s(l?.businessIdReal) || s(l?.businessId))
      .filter((id: string) => id && !id.startsWith("UNLINKED:"))
      .map(asObjectId)
      .filter((x): x is ObjectId => Boolean(x));

    const businesses = businessIds.length
      ? await db
          .collection("businesses")
          .find({ _id: { $in: businessIds } })
          .project({
            business_name: 1,
            description: 1,
            image: 1,
            website: 1,
          })
          .toArray()
      : [];

    const businessMap = new Map(businesses.map((b: any) => [String(b._id), b]));

    const featuredCards: SponsorCard[] = listings
      .map((listing: any) => {
        const businessId = s(listing?.businessIdReal) || s(listing?.businessId);
        const b = businessMap.get(businessId);
        if (!b) return null;

        return {
          _id: businessId,
          name: s(b?.business_name) || "Featured Sponsor",
          tagline:
            s(b?.description).slice(0, 90) ||
            "Featured on Black Wealth Exchange",
          img: safeSponsorImage(s(b?.image)),
          url: normalizeBusinessUrl(s(b?.website), s(b?.business_name)),
          cta: "Learn More",
          tier: s(listing?.tier),
          featuredSlot:
            typeof listing?.featuredSlot === "number"
              ? listing.featuredSlot
              : null,
          source: "directory_listings",
        };
      })
      .filter(Boolean) as SponsorCard[];

    if (featuredCards.length) {
      return res.status(200).json({ ok: true, sponsors: featuredCards });
    }

    const legacy = await db
      .collection("businesses")
      .find({ sponsored: true })
      .sort({ tier: 1 })
      .limit(20)
      .toArray();

    const legacyCards: SponsorCard[] = legacy.map((b: any) => ({
      _id: String(b._id),
      name: s(b?.business_name) || "Sponsored Business",
      tagline: s(b?.description).slice(0, 90) || "Sponsored listing",
      img: safeSponsorImage(s(b?.image)),
      url: normalizeBusinessUrl(s(b?.website), s(b?.business_name)),
      cta: "Learn More",
      tier: s(b?.tier),
      featuredSlot: null,
      source: "businesses",
    }));

    return res.status(200).json({ ok: true, sponsors: legacyCards });
  } catch (error) {
    console.error("Failed to fetch sponsored businesses:", error);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
}
