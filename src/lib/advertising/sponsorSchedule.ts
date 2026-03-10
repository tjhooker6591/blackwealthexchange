import type { Db } from "mongodb";

export type SponsorScheduleRow = {
  campaignId: string;
  option: string;
  placement: string;
  weekStart: Date;
  weekEnd: Date;
  status: "scheduled" | "active" | "completed";
  queueStatus: "assigned" | "rolled_over";
  createdAt: Date;
  updatedAt: Date;
  businessName?: string;
  website?: string;
  targetUrl?: string;
  creativeUrl?: string;
  tagline?: string;
  durationDays?: number;
  requestedStartDate?: Date | null;
};

export function weekStartUtc(input: Date) {
  const d = new Date(
    Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()),
  );
  const day = d.getUTCDay();
  const diff = (day + 6) % 7; // monday start
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function weekEndUtc(weekStart: Date) {
  const e = new Date(weekStart);
  e.setUTCDate(e.getUTCDate() + 6);
  e.setUTCHours(23, 59, 59, 999);
  return e;
}

export async function reserveFeaturedSponsorWeeks(
  db: Db,
  input: {
    campaignId: string;
    durationDays: number;
    requestedStartDate?: string | null;
    flexibleStart?: boolean;
    businessName?: string;
    website?: string;
    targetUrl?: string;
    creativeUrl?: string;
    tagline?: string;
    placement?: string;
    option?: string;
  },
) {
  const capacity = Number(process.env.FEATURED_SPONSOR_WEEKLY_CAP || 4);
  const now = new Date();
  const requested = input.requestedStartDate
    ? new Date(input.requestedStartDate)
    : now;
  const requestedWeek = weekStartUtc(
    Number.isNaN(requested.getTime()) ? now : requested,
  );
  const currentWeek = weekStartUtc(now);
  const baseWeek = input.flexibleStart
    ? currentWeek.getTime() > requestedWeek.getTime()
      ? currentWeek
      : requestedWeek
    : requestedWeek;

  const weeksNeeded = Math.max(
    1,
    Math.ceil((Number(input.durationDays) || 7) / 7),
  );
  const assignments: SponsorScheduleRow[] = [];

  let cursor = new Date(baseWeek);
  for (let i = 0; i < weeksNeeded; i++) {
    // find first week with free slot
    while (true) {
      const count = await db
        .collection("featured_sponsor_schedule")
        .countDocuments({
          placement: input.placement || "homepage-featured-sponsor",
          weekStart: cursor,
          status: { $in: ["scheduled", "active"] },
        });
      if (count < capacity) break;
      cursor = weekStartUtc(
        new Date(cursor.getTime() + 7 * 24 * 60 * 60 * 1000),
      );
    }

    const row: SponsorScheduleRow = {
      campaignId: input.campaignId,
      option: input.option || "featured-sponsor",
      placement: input.placement || "homepage-featured-sponsor",
      weekStart: new Date(cursor),
      weekEnd: weekEndUtc(cursor),
      status: "scheduled",
      queueStatus:
        cursor.getTime() === baseWeek.getTime() ? "assigned" : "rolled_over",
      businessName: input.businessName,
      website: input.website,
      targetUrl: input.targetUrl,
      creativeUrl: input.creativeUrl,
      tagline: input.tagline,
      durationDays: Number(input.durationDays) || 7,
      requestedStartDate: input.requestedStartDate
        ? new Date(input.requestedStartDate)
        : null,
      createdAt: now,
      updatedAt: now,
    };

    await db
      .collection("featured_sponsor_schedule")
      .updateOne(
        { campaignId: input.campaignId, weekStart: row.weekStart },
        { $setOnInsert: row, $set: { updatedAt: now } },
        { upsert: true },
      );

    assignments.push(row);
    cursor = weekStartUtc(new Date(cursor.getTime() + 7 * 24 * 60 * 60 * 1000));
  }

  return assignments;
}
