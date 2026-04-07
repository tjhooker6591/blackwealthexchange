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
  "Pamfa United Citizen": "/images/sponsors/pamfaunitedcitizens.jpg",
  "Pamfa United Citizens": "/images/sponsors/pamfaunitedcitizens.jpg",
  "Guardians of the Forgotten Realm":
    "/images/sponsors/guardiansoftheforgottenreleam.jpg",
};

const HOUSE_SPONSOR_ROTATION: Array<{ name: string; url: string }> = [
  { name: "TitanEra", url: "/" },
  { name: "Thomas Hooker Author", url: "/" },
  { name: "Pamfa United Citizen", url: "/" },
  { name: "The Last Nephilim", url: "/" },
  { name: "Guardians of the Forgotten Realm", url: "/" },
  { name: "Tiana Song Sprouts", url: "/" },
];

function safeSponsorImage(raw: string) {
  const v = s(raw);
  if (!v) return HOUSE_SPONSOR_FALLBACK;
  if (v.startsWith("/")) return v;

  try {
    const u = new URL(v);
    if (u.hostname === "example.com" || u.hostname.endsWith(".example.com")) {
      return HOUSE_SPONSOR_FALLBACK;
    }
    if (u.protocol === "http:" || u.protocol === "https:") {
      return v;
    }
    return HOUSE_SPONSOR_FALLBACK;
  } catch {
    return HOUSE_SPONSOR_FALLBACK;
  }
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
  return rows.map((row: any, i: number) => {
    const name = s(row.businessName) || "Featured Sponsor";
    const tagline =
      s(row.tagline).slice(0, 90) || "Featured on Black Wealth Exchange";
    const img = resolveSponsorImage(name, s(row.creativeUrl));
    const target = normalizeBusinessUrl(s(row.targetUrl || row.website));

    return {
      _id: String(row.campaignId || row._id),
      name,
      tagline,
      img,
      url: featuredProfileUrl(name, tagline, img, target),
      cta: "Learn More",
      tier: "featured-sponsor",
      featuredSlot:
        typeof row.sortOrder === "number" ? row.sortOrder : i + 1,
      source: "featured_sponsor_schedule",
      weekStart: row.weekStart ? new Date(row.weekStart).toISOString() : null,
      queueStatus: s(row.queueStatus) || null,
    };
  });
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
      return res.status(200).json({ ok: true, sponsors: mapScheduleRows(scheduled) });
    }

    // Exact regression fix:
    // if current-week rows are missing/expired, stay inside featured_sponsor_schedule
    // and use the most recent schedule set instead of falling back to stale
    // directory_listings / legacy businesses.
    const latestAnchor = await collection
      .find({
        placement: "homepage-featured-sponsor",
        status: { $in: ["scheduled", "active"] },
      })
      .sort({ weekStart: -1, sortOrder: 1, createdAt: -1 })
      .limit(1)
      .toArray();

    if (latestAnchor.length && latestAnchor[0]?.weekStart) {
      const latestWeekStart = new Date(latestAnchor[0].weekStart);
      const latestWeekEnd = new Date(latestWeekStart);
      latestWeekEnd.setUTCDate(latestWeekEnd.getUTCDate() + 1);

      const latestScheduled = await collection
        .find({
          placement: "homepage-featured-sponsor",
          status: { $in: ["scheduled", "active"] },
          weekStart: {
            $gte: latestWeekStart,
            $lt: latestWeekEnd,
          },
        })
        .sort({ sortOrder: 1, createdAt: 1 })
        .limit(12)
        .toArray();

      if (latestScheduled.length) {
        return res
          .status(200)
          .json({ ok: true, sponsors: mapScheduleRows(latestScheduled) });
      }
    }

    const houseCards: SponsorCard[] = HOUSE_SPONSOR_ROTATION.map((sponsor, i) => {
      const img = resolveSponsorImage(sponsor.name, "");
      const tagline = "Featured on Black Wealth Exchange";

      return {
        _id: `house-${i + 1}`,
        name: sponsor.name,
        tagline,
        img,
        url: featuredProfileUrl(sponsor.name, tagline, img, sponsor.url),
        cta: "Learn More",
        tier: "featured-sponsor",
        featuredSlot: i + 1,
        source: "featured_sponsor_schedule",
        weekStart: currentWeek.toISOString(),
        queueStatus: "assigned",
      };
    });

    return res.status(200).json({ ok: true, sponsors: houseCards });
  } catch (error) {
    console.error("Failed to fetch sponsored businesses:", error);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
}