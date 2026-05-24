import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
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

function normalizeBusinessUrl(raw: string) {
  const v = s(raw);
  if (!v || v === "/" || v === "#") return "";

  if (/^https?:\/\//i.test(v)) {
    try {
      const u = new URL(v);
      if (!u.hostname) return "";
      return v;
    } catch {
      return "";
    }
  }

  if (v.startsWith("/")) return "";

  try {
    const withProto = `https://${v}`;
    const u = new URL(withProto);
    if (!u.hostname) return "";
    return withProto;
  } catch {
    return "";
  }
}

function featuredProfileUrl(
  name: string,
  tagline: string,
  img: string,
  target: string,
) {
  const qs = new URLSearchParams();
  if (name) qs.set("name", name);
  if (tagline) qs.set("tagline", tagline);
  if (img) qs.set("img", img);
  if (target) qs.set("target", target);
  return `/featured?${qs.toString()}`;
}

function mapScheduleRows(rows: any[]): SponsorCard[] {
  return rows
    .map((row: any, i: number) => {
      const name = s(row.businessName) || "Featured Sponsor";
      const tagline =
        s(row.tagline).slice(0, 90) || "Featured on Black Wealth Exchange";
      const img = resolveSponsorImage(name, s(row.creativeUrl));
      const target = normalizeBusinessUrl(s(row.targetUrl || row.website));
      const isKnownSponsor = Boolean(HOUSE_SPONSOR_IMAGE_MAP[s(name)]);
      const hasExplicitApprovedImage =
        img.startsWith("/images/sponsors/") && img !== HOUSE_SPONSOR_FALLBACK;

      if (!isKnownSponsor && !hasExplicitApprovedImage) {
        return null;
      }

      return {
        _id: String(row.campaignId || row._id),
        name,
        tagline,
        img,
        url: featuredProfileUrl(name, tagline, img, target),
        cta: "Learn More",
        tier: "featured-sponsor",
        featuredSlot: typeof row.sortOrder === "number" ? row.sortOrder : i + 1,
        source: "featured_sponsor_schedule",
        weekStart: row.weekStart ? new Date(row.weekStart).toISOString() : null,
        queueStatus: s(row.queueStatus) || null,
      };
    })
    .filter(Boolean) as SponsorCard[];
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
      const mappedScheduled = mapScheduleRows(scheduled);
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
      const mappedRecent = mapScheduleRows(recentScheduled);
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
      .map((row: any, i: number) => {
        const paidAt = row?.paidAt ? new Date(row.paidAt) : null;
        const duration = Number(row?.durationDays || 30);
        const expiresAt = paidAt
          ? new Date(
              paidAt.getTime() + Math.max(1, duration) * 24 * 60 * 60 * 1000,
            )
          : null;

        if (expiresAt && expiresAt < now) return null;

        const name = s(row.business) || "Featured Sponsor";
        const tagline =
          s(row.details).slice(0, 90) || "Featured on Black Wealth Exchange";
        const img = resolveSponsorImage(name, s(row.adImage));
        const target = normalizeBusinessUrl(s(row.targetUrl || row.website));
        const isKnownSponsor = Boolean(HOUSE_SPONSOR_IMAGE_MAP[s(name)]);
        const hasExplicitApprovedImage =
          img.startsWith("/images/sponsors/") && img !== HOUSE_SPONSOR_FALLBACK;

        if (!isKnownSponsor && !hasExplicitApprovedImage) return null;

        return {
          _id: String(row._id),
          name,
          tagline,
          img,
          url: featuredProfileUrl(name, tagline, img, target),
          cta: "Learn More",
          tier: "featured-sponsor",
          featuredSlot: i + 1,
          source: "featured_sponsor_schedule" as const,
          weekStart: null,
          queueStatus: "assigned",
        } satisfies SponsorCard;
      })
      .filter(Boolean) as SponsorCard[];

    if (paidRows.length) {
      return res.status(200).json({
        ok: true,
        sponsors: paidRows.slice(0, 12),
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
