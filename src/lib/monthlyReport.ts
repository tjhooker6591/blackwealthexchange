// src/lib/monthlyReport.ts
//
// The monthly report email for Founding (claimed) members: what happened on
// their listing in the month just finished. Sent on the 1st by
// /api/cron/monthly-reports, at most once per membership per month
// (monthly_report_sends), with a summary copy to the site owner.

import { ObjectId, type Db } from "mongodb";
import { sendEmail } from "@/lib/sendEmail";
import { PROFILE_VIEWS_COLLECTION } from "@/lib/profileViews";
import { FOUNDING_MEMBERSHIP_PRODUCT_KEY } from "@/lib/founding-membership";

const SITE = "https://www.blackwealthexchange.com";
const SENDS = "monthly_report_sends";

function s(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function idFilter(id: string) {
  return ObjectId.isValid(id) && String(new ObjectId(id)) === id
    ? { _id: new ObjectId(id) }
    : { _id: id as any };
}

// The calendar month before `now` (UTC), e.g. run on Nov 1 -> October.
export function previousMonth(now = new Date()) {
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
  );
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const before = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2, 1),
  );
  const key = start.toISOString().slice(0, 7);
  const label = start.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return { start, end, before, key, label };
}

export type MonthlyReportData = {
  businessId: string;
  businessName: string;
  alias: string | null;
  monthLabel: string;
  views: number;
  viewsMonthBefore: number;
  memberVisitors: number;
  followersNew: number;
  followersTotal: number;
  savesNew: number;
  savesTotal: number;
  reviewsNew: number;
  reviewsTotal: number;
  averageRating: number | null;
  verifiedBoost: boolean;
  tip: string;
};

export async function getMonthlyReportData(
  db: Db,
  businessId: string,
  period = previousMonth(),
): Promise<MonthlyReportData | null> {
  const id = String(businessId);
  const business = await db.collection("businesses").findOne(idFilter(id));
  if (!business) return null;
  const inPeriod = { $gte: period.start, $lt: period.end };
  const views = db.collection(PROFILE_VIEWS_COLLECTION);

  const [
    viewCount,
    viewsBefore,
    memberVisitorIds,
    followersNew,
    followersTotal,
    savesNew,
    savesTotal,
    reviews,
  ] = await Promise.all([
    views.countDocuments({ businessId: id, viewedAt: inPeriod }),
    views.countDocuments({
      businessId: id,
      viewedAt: { $gte: period.before, $lt: period.start },
    }),
    views.distinct("viewerUserId", {
      businessId: id,
      viewedAt: inPeriod,
      viewerUserId: { $ne: null },
    }),
    db
      .collection("follows")
      .countDocuments({ businessId: id, createdAt: inPeriod }),
    db
      .collection("follows")
      .countDocuments({ businessId: id, createdAt: { $lt: period.end } }),
    db
      .collection("saved_businesses")
      .countDocuments({ businessId: id, savedAt: inPeriod }),
    db
      .collection("saved_businesses")
      .countDocuments({ businessId: id, savedAt: { $lt: period.end } }),
    db
      .collection("business_reviews")
      .find({ businessId: id })
      .project({ createdAt: 1, rating: 1 })
      .toArray(),
  ]);

  const asDate = (v: any) => (v instanceof Date ? v : new Date(v || 0));
  const reviewsUpTo = reviews.filter(
    (r: any) => asDate(r.createdAt) < period.end,
  );
  const reviewsNew = reviewsUpTo.filter(
    (r: any) => asDate(r.createdAt) >= period.start,
  ).length;
  const ratings = reviewsUpTo
    .map((r: any) => Number(r.rating) || 0)
    .filter((n) => n > 0);
  const averageRating = ratings.length
    ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) /
      10
    : null;

  const b: any = business;
  const hasImage = Boolean(s(b.image) || s(b.logo) || s(b.coverImage));
  const tip = !hasImage
    ? "Add a photo or logo to your listing. Listings with a picture get noticed more."
    : !s(b.description) || s(b.description).length < 120
      ? "Add a few sentences about what makes your business special. A fuller description helps people choose you."
      : reviewsUpTo.length === 0
        ? "Ask a happy customer to leave a review on your listing. Your first review builds trust with everyone who visits after."
        : "Share your listing link with your customers and on social media so more people can find and follow you.";

  return {
    businessId: String(b._id),
    businessName:
      s(b.business_name) || s(b.businessName) || s(b.title) || "Your business",
    alias: s(b.alias) || s(b.slug) || null,
    monthLabel: period.label,
    views: viewCount,
    viewsMonthBefore: viewsBefore,
    memberVisitors: memberVisitorIds.length,
    followersNew,
    followersTotal,
    savesNew,
    savesTotal,
    reviewsNew,
    reviewsTotal: reviewsUpTo.length,
    averageRating,
    verifiedBoost: b.verified === true,
    tip,
  };
}

export function buildMonthlyReportEmail(
  d: MonthlyReportData,
  firstName: string,
) {
  const greeting = firstName ? `Hi ${firstName},` : "Hi there,";
  const change = d.views - d.viewsMonthBefore;
  const viewsLine =
    d.viewsMonthBefore > 0 || d.views > 0
      ? `${d.views} page view${d.views === 1 ? "" : "s"} (${change >= 0 ? "+" : ""}${change} from the month before)`
      : "No page views yet";
  const listing = d.alias
    ? `${SITE}/business-directory/${encodeURIComponent(d.alias)}`
    : SITE;
  const reportUrl = `${SITE}/founding-membership/status`;
  const viewersUrl = `${SITE}/business/profile?businessId=${encodeURIComponent(d.businessId)}`;

  const rows: Array<[string, string]> = [
    ["Page views", viewsLine],
    ["Members who visited", `${d.memberVisitors}`],
    ["New followers", `${d.followersNew} (${d.followersTotal} total)`],
    ["New saves", `${d.savesNew} (${d.savesTotal} total)`],
    [
      "New reviews",
      `${d.reviewsNew} (${d.reviewsTotal} total${d.averageRating != null ? `, ${d.averageRating}★ average` : ""})`,
    ],
    ["Verified boost in search", d.verifiedBoost ? "On" : "Not yet"],
  ];

  const subject = `Your ${d.monthLabel} report for ${d.businessName}`;
  const text = `${greeting}

Here's how ${d.businessName} did on Black Wealth Exchange in ${d.monthLabel}.

${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}

See who visited: ${viewersUrl}
Your full report: ${reportUrl}
Your listing: ${listing}

Tip for this month: ${d.tip}

Thank you for being a Founding member. If you have any questions, just reply to this email.

With gratitude,
Thomas Hooker
Black Wealth Exchange`;

  const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1a1a1a;max-width:600px">
<p>${escapeHtml(greeting)}</p>
<p>Here's how <strong>${escapeHtml(d.businessName)}</strong> did on Black Wealth Exchange in ${escapeHtml(d.monthLabel)}.</p>
<table style="border-collapse:collapse;width:100%;margin:12px 0">
${rows
  .map(
    ([k, v]) =>
      `<tr><td style="padding:8px 10px;border-bottom:1px solid #eee;color:#555">${escapeHtml(k)}</td><td style="padding:8px 10px;border-bottom:1px solid #eee;font-weight:bold">${escapeHtml(v)}</td></tr>`,
  )
  .join("\n")}
</table>
<p><a href="${escapeHtml(viewersUrl)}">See who visited</a> · <a href="${escapeHtml(reportUrl)}">Your full report</a> · <a href="${escapeHtml(listing)}">Your listing</a></p>
<p style="background:#fff8e1;border-left:4px solid #d4af37;padding:10px 12px"><strong>Tip for this month:</strong> ${escapeHtml(d.tip)}</p>
<p>Thank you for being a Founding member. If you have any questions, just reply to this email.</p>
<p>With gratitude,<br>Thomas Hooker<br>Black Wealth Exchange</p>
</div>`;

  return { subject, text, html };
}

async function ownerFirstName(db: Db, email: string) {
  for (const col of ["users", "businesses"]) {
    const doc: any = await db.collection(col).findOne(
      {
        email: new RegExp(
          `^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          "i",
        ),
      },
      {
        projection: { fullName: 1, name: 1, firstName: 1 },
      },
    );
    const name = s(doc?.firstName) || s(doc?.fullName) || s(doc?.name);
    if (name) return name.split(/\s+/)[0];
  }
  return "";
}

export type SendResult = {
  membershipId: string;
  businessName: string;
  to: string;
  status: "sent" | "already_sent" | "skipped" | "failed";
  reason?: string;
};

// Sends last month's report to every active Founding member (or one, for a
// test). `testTo` sends to that address instead, without marking it sent.
export async function sendMonthlyReports(
  db: Db,
  opts: {
    now?: Date;
    membershipId?: string;
    testTo?: string;
    includeTest?: boolean;
  } = {},
): Promise<{ period: string; results: SendResult[] }> {
  const period = previousMonth(opts.now);
  const filter: Record<string, any> = {
    productKey: FOUNDING_MEMBERSHIP_PRODUCT_KEY,
    membershipStatus: "active",
  };
  if (opts.membershipId) {
    filter.$or = [
      { _id: opts.membershipId },
      { membershipId: opts.membershipId },
    ];
  } else if (!opts.includeTest) filter.isTestMembership = { $ne: true };

  const memberships = await db
    .collection("business_memberships")
    .find(filter)
    .toArray();
  const sends = db.collection(SENDS);
  if (!opts.testTo) {
    await sends
      .createIndex({ membershipId: 1, period: 1 }, { unique: true })
      .catch(() => {});
  }

  const results: SendResult[] = [];
  for (const m of memberships as any[]) {
    const membershipId = String(m._id);
    const memberEmail = s(m.userEmail) || s(m.email);
    const to = opts.testTo || memberEmail;
    const data = await getMonthlyReportData(
      db,
      String(m.businessId || ""),
      period,
    );
    if (!data || !to) {
      results.push({
        membershipId,
        businessName: data?.businessName || "-",
        to,
        status: "skipped",
        reason: !data ? "business not found" : "no email",
      });
      continue;
    }
    if (
      !opts.testTo &&
      (await sends.findOne({ membershipId, period: period.key }))
    ) {
      results.push({
        membershipId,
        businessName: data.businessName,
        to,
        status: "already_sent",
      });
      continue;
    }
    try {
      const email = buildMonthlyReportEmail(
        data,
        memberEmail ? await ownerFirstName(db, memberEmail) : "",
      );
      await sendEmail({
        to,
        subject: opts.testTo ? `[TEST] ${email.subject}` : email.subject,
        text: email.text,
        html: email.html,
      });
      if (!opts.testTo) {
        await sends.insertOne({
          membershipId,
          businessId: data.businessId,
          period: period.key,
          to,
          sentAt: new Date(),
        });
      }
      results.push({
        membershipId,
        businessName: data.businessName,
        to,
        status: "sent",
      });
    } catch (err: any) {
      console.error("[monthlyReport] send failed", membershipId, err);
      results.push({
        membershipId,
        businessName: data.businessName,
        to,
        status: "failed",
        reason: String(err?.message || err).slice(0, 200),
      });
    }
  }
  return { period: period.label, results };
}

export async function sendOwnerSummary(summary: {
  period: string;
  results: SendResult[];
}) {
  const to = s(process.env.SMTP_FROM);
  if (!to || !summary.results.length) return;
  const lines = summary.results.map(
    (r) =>
      `- ${r.businessName}: ${r.status}${r.reason ? ` (${r.reason})` : ""}`,
  );
  const sent = summary.results.filter((r) => r.status === "sent").length;
  await sendEmail({
    to,
    subject: `Monthly reports for ${summary.period}: ${sent} sent`,
    text: `Monthly member reports for ${summary.period}:\n\n${lines.join("\n")}`,
    html: `<p>Monthly member reports for ${escapeHtml(summary.period)}:</p><ul>${summary.results
      .map(
        (r) =>
          `<li>${escapeHtml(r.businessName)}: ${escapeHtml(r.status)}${r.reason ? ` (${escapeHtml(r.reason)})` : ""}</li>`,
      )
      .join("")}</ul>`,
  }).catch((err) => console.error("[monthlyReport] owner summary failed", err));
}
