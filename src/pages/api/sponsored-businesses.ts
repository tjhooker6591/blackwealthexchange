import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { weekStartUtc } from "@/lib/advertising/sponsorSchedule";
import {
  buildSponsorPublicHref,
  findSponsorBusinessesByIds,
  resolveSponsorBusinessLinks,
  type SponsorCampaignRecord,
} from "@/lib/advertising/sponsorListings";

type SponsorCard = {
  _id: string;
  businessId: string;
  alias: string;
  slug: string;
  name: string;
  businessName: string;
  tagline: string;
  description?: string;
  category?: string;
  categories?: string[] | string;
  city?: string;
  state?: string;
  img: string;
  url: string;
  cta: string;
  tier?: string;
  featuredSlot?: number | null;
  source:
    | "featured_sponsor_schedule"
    | "advertising_requests"
    | "directory_listings"
    | "businesses";
  weekStart?: string | null;
  queueStatus?: string | null;
};

function s(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

const HOUSE_SPONSOR_FALLBACK = "/images/sponsors/house-draft.jpg";

const HOUSE_SPONSOR_IMAGE_MAP: Record<string, string> = {
  TitanEra: "/images/sponsors/titanera.jpg",
  "Thomas Hooker Author": "/images/sponsors/thomashookerauthor.png",
  "Thomas Hooker Publisher": "/images/sponsors/house-draft.jpg",
  Millianious: "/images/sponsors/millianious.jpg",
  "Tiana Song Sprouts": "/images/sponsors/tiana-song-sprouts.jpg",
  "The Last Nephilim": "/images/sponsors/thelastnephilim.jpg",
  "Pamfa United Citizen": "/images/sponsors/pamfaunitedcitizen.jpg",
  "Pamfa United Citizens": "/images/sponsors/pamfaunitedcitizen.jpg",
  "Guardians of the Forgotten Realm":
    "/images/sponsors/Guardiansoftheforgottenrealm.jpg",
};

const SPONSOR_IMAGE_PATH_ALIASES: Record<string, string> = {
  "/images/sponsors/guardiansoftheforgottenrealm.jpg":
    "/images/sponsors/Guardiansoftheforgottenrealm.jpg",
  "/images/sponsors/pamfaunitedcitizens.jpg":
    "/images/sponsors/pamfaunitedcitizen.jpg",
};

function normalizeSponsorImagePath(v: string) {
  const key = v.trim();
  return SPONSOR_IMAGE_PATH_ALIASES[key] || key;
}

function safeSponsorImage(raw: string) {
  const v = s(raw);
  if (!v) return HOUSE_SPONSOR_FALLBACK;

  // Homepage sponsor path is strict: approved local assets only.
  if (v.startsWith("/images/sponsors/")) {
    return normalizeSponsorImagePath(v);
  }

  return HOUSE_SPONSOR_FALLBACK;
}

function resolveSponsorImage(name: string, raw: string) {
  const direct = safeSponsorImage(raw);

  // DB creativeUrl must win first.
  if (direct !== HOUSE_SPONSOR_FALLBACK) {
    return direct;
  }

  const mapped = HOUSE_SPONSOR_IMAGE_MAP[s(name)];
  if (mapped) return mapped;

  return HOUSE_SPONSOR_FALLBACK;
}

function mapResolvedSponsors(
  campaigns: SponsorCampaignRecord[],
  businesses: any[],
) {
  const resolved = resolveSponsorBusinessLinks(campaigns, businesses);
  return resolved.map((link, i) => {
    const img = resolveSponsorImage(link.sponsorName, link.imageUrl);
    const isKnownSponsor = Boolean(HOUSE_SPONSOR_IMAGE_MAP[s(link.sponsorName)]);
    const hasExplicitApprovedImage =
      img.startsWith("/images/sponsors/") && img !== HOUSE_SPONSOR_FALLBACK;

    if (!isKnownSponsor && !hasExplicitApprovedImage) return null;

    return {
      _id: link.businessId,
      businessId: link.businessId,
      alias: link.alias,
      slug: link.alias,
      name: link.sponsorName,
      businessName: link.businessName,
      tagline: link.tagline,
      description:
        s((link.business as any).description) || link.tagline || "",
      category: s(
        (link.business as any).primaryCategory || (link.business as any).category,
      ),
      categories:
        (link.business as any).display_categories ||
        (link.business as any).categories ||
        (link.business as any).category ||
        [],
      city: s((link.business as any).city),
      state: s((link.business as any).state),
      img,
      url: buildSponsorPublicHref(link.alias),
      cta: "Learn More",
      tier: "featured-sponsor",
      featuredSlot: i + 1,
      source: link.source,
      weekStart: link.weekStart ? link.weekStart.toISOString() : null,
      queueStatus: link.queueStatus,
    } satisfies SponsorCard;
  }).filter(Boolean) as SponsorCard[];
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
    const collection = db.collection("featured_sponsor_schedule");

    const now = new Date();
    const weekParam = s(req.query.weekStart);
    const weekInput = weekParam ? new Date(weekParam) : now;
    const currentWeek = weekStartUtc(
      Number.isNaN(weekInput.getTime()) ? now : weekInput,
    );

    const scheduled = await collection
      .find({
        placement: "homepage-featured-sponsor",
        status: { $in: ["scheduled", "active"] },
        $or: [
          { weekStart: currentWeek },
          {
            status: "active",
            weekStart: { $lte: now },
            $or: [{ weekEnd: { $exists: false } }, { weekEnd: { $gte: now } }],
          },
        ],
      })
      .sort({ sortOrder: 1, createdAt: 1 })
      .limit(12)
      .toArray();

    if (scheduled.length) {
      const businessDocs = await findSponsorBusinessesByIds(
        db,
        scheduled.map((row: any) => s(row.businessId)),
      );
      const mappedScheduled = mapResolvedSponsors(
        scheduled.map(
          (row: any): SponsorCampaignRecord => ({
            campaignId: String(row.campaignId || row._id),
            businessId: s(row.businessId),
            sponsorName: s(row.businessName) || "Featured Sponsor",
            tagline: s(row.tagline).slice(0, 90),
            imageUrl: s(row.creativeUrl),
            source: "featured_sponsor_schedule",
            weekStart: row.weekStart ? new Date(row.weekStart) : null,
            queueStatus: s(row.queueStatus) || null,
            inventoryTier: 1,
          }),
        ),
        businessDocs.filter(Boolean),
      );
      if (mappedScheduled.length) {
        return res.status(200).json({
          ok: true,
          sponsors: mappedScheduled,
          meta: { source: "featured_sponsor_schedule_current_week" },
        });
      }
    }

    // If current-week rows are missing/empty-after-filter, use the most recent
    // mappable scheduled rows across recent weeks.
    const recentScheduled = await collection
      .find({
        placement: "homepage-featured-sponsor",
        status: { $in: ["scheduled", "active"] },
      })
      .sort({ weekStart: -1, sortOrder: 1, createdAt: -1 })
      .limit(60)
      .toArray();

    if (recentScheduled.length) {
      const businessDocs = await findSponsorBusinessesByIds(
        db,
        recentScheduled.map((row: any) => s(row.businessId)),
      );
      const mappedRecent = mapResolvedSponsors(
        recentScheduled.map(
          (row: any): SponsorCampaignRecord => ({
            campaignId: String(row.campaignId || row._id),
            businessId: s(row.businessId),
            sponsorName: s(row.businessName) || "Featured Sponsor",
            tagline: s(row.tagline).slice(0, 90),
            imageUrl: s(row.creativeUrl),
            source: "featured_sponsor_schedule",
            weekStart: row.weekStart ? new Date(row.weekStart) : null,
            queueStatus: s(row.queueStatus) || null,
            inventoryTier: 1,
          }),
        ),
        businessDocs.filter(Boolean),
      );
      if (mappedRecent.length) {
        return res.status(200).json({
          ok: true,
          sponsors: mappedRecent.slice(0, 12),
          meta: { source: "featured_sponsor_schedule_recent_mappable" },
        });
      }
    }

    // Final non-fallback source: paid + approved featured-sponsor campaigns
    // that are not expired yet, even if scheduler rows were not generated.
    const paidFeatured = await db
      .collection("advertising_requests")
      .aggregate([
        {
          $match: {
            option: "featured-sponsor",
            paymentStatus: "paid",
            reviewStatus: "approved",
            status: { $in: ["approved", "active"] },
          },
        },
        { $sort: { paidAt: -1, updatedAt: -1, createdAt: -1 } },
        { $limit: 20 },
      ])
      .toArray();

    const paidRows = paidFeatured
      .map((row: any) => {
        const paidAt = row?.paidAt ? new Date(row.paidAt) : null;
        const duration = Number(row?.durationDays || 30);
        const expiresAt = paidAt
          ? new Date(
              paidAt.getTime() + Math.max(1, duration) * 24 * 60 * 60 * 1000,
            )
          : null;

        if (expiresAt && expiresAt < now) return null;
        return {
          campaignId: String(row._id),
          businessId: s(row.businessId),
          sponsorName: s(row.business) || "Featured Sponsor",
          tagline:
            s(row.details).slice(0, 90) || "Featured on Black Wealth Exchange",
          imageUrl: s(row.adImage),
          source: "advertising_requests" as const,
          weekStart: null,
          queueStatus: "assigned",
          inventoryTier: 2,
          paidAt,
        } satisfies SponsorCampaignRecord;
      })
      .filter(Boolean) as SponsorCampaignRecord[];

    if (paidRows.length) {
      const mappedPaid = mapResolvedSponsors(
        paidRows,
        await findSponsorBusinessesByIds(
          db,
          paidRows.map((row) => row.businessId),
        ),
      );
      if (!mappedPaid.length) {
        return res.status(200).json({
          ok: true,
          sponsors: [],
          meta: { source: "none_active" },
        });
      }
      return res.status(200).json({
        ok: true,
        sponsors: mappedPaid.slice(0, 12),
        meta: { source: "advertising_requests_paid_approved" },
      });
    }

    return res.status(200).json({
      ok: true,
      sponsors: [],
      meta: { source: "none_active" },
    });
  } catch (error) {
    console.error("Failed to fetch sponsored businesses:", error);

    return res.status(200).json({
      ok: true,
      sponsors: [],
      meta: { source: "error_empty" },
    });
  }
}
