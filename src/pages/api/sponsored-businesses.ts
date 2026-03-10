import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

type SponsorCard = {
  _id: string;
  name: string;
  tagline: string;
  img: string;
  url: string;
  cta: string;
  tier?: string;
  featuredSlot?: number | null;
  source: "directory_listings" | "businesses";
};

function s(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function normalizeBusinessUrl(raw: string) {
  const v = s(raw);
  if (!v) return "#";
  if (/^https?:\/\//i.test(v)) return v;
  return `https://${v}`;
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
    const db = client.db("bwes-cluster");
    const now = new Date();

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

    const businessMap = new Map(
      businesses.map((b: any) => [String(b._id), b]),
    );

    const featuredCards: SponsorCard[] = listings
      .map((listing: any) => {
        const businessId = s(listing?.businessIdReal) || s(listing?.businessId);
        const b = businessMap.get(businessId);
        if (!b) return null;

        return {
          _id: businessId,
          name: s(b?.business_name) || "Featured Sponsor",
          tagline: s(b?.description).slice(0, 90) || "Featured on Black Wealth Exchange",
          img: s(b?.image) || "/default-image.jpg",
          url: normalizeBusinessUrl(s(b?.website)),
          cta: "Learn More",
          tier: s(listing?.tier),
          featuredSlot:
            typeof listing?.featuredSlot === "number" ? listing.featuredSlot : null,
          source: "directory_listings",
        };
      })
      .filter(Boolean) as SponsorCard[];

    if (featuredCards.length) {
      return res.status(200).json({ ok: true, sponsors: featuredCards });
    }

    // Legacy fallback path
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
      img: s(b?.image) || "/default-image.jpg",
      url: normalizeBusinessUrl(s(b?.website)),
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
