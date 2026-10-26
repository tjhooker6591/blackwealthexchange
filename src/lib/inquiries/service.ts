// Inquiries from the BWE contact form: saved first, then a reply, a team
// alert and (for business inquiries with a phone) a hand-off to
// Speed-to-Lead. Nothing after the save can make the submission fail.
// Email, network and clock are passed in so the whole flow can be tested
// without sending anything.
import crypto from "node:crypto";
import type { Db } from "mongodb";
import { inquiryCategory, type InquiryCategory } from "./categories";

export type InquiryDeps = {
  sendEmail: (args: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }) => Promise<unknown>;
  fetch: typeof fetch;
  now: () => Date;
  baseUrl: string;
  secret: string; // signs unsubscribe links
  teamEmail: string;
  speedToLeadUrl?: string; // BWE's website connection URL in Speed-to-Lead
};

export type InquiryInput = {
  category?: unknown;
  name?: unknown;
  businessName?: unknown;
  email?: unknown;
  phone?: unknown;
  message?: unknown;
  listingUrl?: unknown;
  sourceForm?: unknown;
  website?: unknown; // honeypot: people never fill it in
};

type ForwardState =
  | "not_applicable"
  | "pending"
  | "waiting_for_go_live"
  | "retrying"
  | "sent"
  | "failed";

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const text = (v: unknown, max: number) =>
  String(v ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
const phoneDigits = (v: unknown) => {
  const d = String(v ?? "").replace(/\D/g, "");
  return d.length === 11 && d.startsWith("1") ? d.slice(1) : d;
};
const esc = (v: unknown) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ] as string,
  );

export class InquiryError extends Error {
  constructor(
    message: string,
    public field: string,
  ) {
    super(message);
  }
}

export function unsubscribeToken(email: string, secret: string) {
  return crypto
    .createHmac("sha256", secret)
    .update(`unsubscribe:${email.toLowerCase()}`)
    .digest("hex")
    .slice(0, 32);
}
export function unsubscribeUrl(
  email: string,
  deps: Pick<InquiryDeps, "baseUrl" | "secret">,
) {
  return `${deps.baseUrl.replace(/\/$/, "")}/api/inquiries/unsubscribe?e=${encodeURIComponent(email)}&t=${unsubscribeToken(email, deps.secret)}`;
}

export function validateInquiry(input: InquiryInput) {
  const category = inquiryCategory(input.category);
  if (!category)
    throw new InquiryError("Choose what your inquiry is about.", "category");
  const name = text(input.name, 120);
  if (name.length < 2) throw new InquiryError("Enter your name.", "name");
  const email = text(input.email, 200)
    .toLowerCase()
    .replace(/^www\./, "");
  if (!EMAIL_RX.test(email))
    throw new InquiryError(
      "Enter a valid email address, like name@example.com.",
      "email",
    );
  const phone = phoneDigits(input.phone);
  if (phone && phone.length !== 10)
    throw new InquiryError("A US phone number has 10 digits.", "phone");
  const message = String(input.message ?? "")
    .trim()
    .slice(0, 4000);
  if (message.length < 5)
    throw new InquiryError("Tell us a little about what you need.", "message");
  return {
    category,
    name,
    businessName: text(input.businessName, 160) || null,
    email,
    phone: phone || null,
    message,
    listingUrl: text(input.listingUrl, 500) || null,
    sourceForm: text(input.sourceForm, 60) || "contact",
  };
}

const dayKey = (d: Date) => d.toISOString().slice(0, 10);
// One inquiry per person, per category, per day: a second submit (double
// click, resend) gets no second reply, alert or hand-off.
const dedupeKey = (email: string, category: string, at: Date) =>
  crypto
    .createHash("sha256")
    .update(`${email}|${category}|${dayKey(at)}`)
    .digest("hex");

export async function ensureInquiryIndexes(db: Db) {
  const col = db.collection("inquiries");
  await col.createIndex({ dedupeKey: 1 }, { unique: true });
  await col.createIndex({ createdAt: -1 });
  await col.createIndex({
    "speedToLead.state": 1,
    "speedToLead.nextAttemptAt": 1,
  });
  await col.createIndex({ email: 1 });
}

function replyEmail(
  cat: InquiryCategory,
  rec: { name: string; email: string },
  deps: InquiryDeps,
) {
  const first = rec.name.split(" ")[0];
  const link = `${deps.baseUrl.replace(/\/$/, "")}${cat.reply.link.path}`;
  const unsub = unsubscribeUrl(rec.email, deps);
  const textBody = [
    `Hi ${first},`,
    ...cat.reply.paragraphs,
    `${cat.reply.link.text}: ${link}`,
    ...(cat.reply.question ? [cat.reply.question] : []),
    "Thanks,\nBlack Wealth Exchange\nhttps://www.blackwealthexchange.com",
    `If you'd rather not get emails like this, unsubscribe here: ${unsub}`,
  ].join("\n\n");
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a;max-width:560px">
<p>Hi ${esc(first)},</p>${cat.reply.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("")}
<p><a href="${esc(link)}" style="color:#9a7b16;font-weight:bold">${esc(cat.reply.link.text)}</a></p>
${cat.reply.question ? `<p>${esc(cat.reply.question)}</p>` : ""}
<p>Thanks,<br>Black Wealth Exchange<br><a href="https://www.blackwealthexchange.com">blackwealthexchange.com</a></p>
<p style="font-size:12px;color:#777">If you'd rather not get emails like this, <a href="${esc(unsub)}">unsubscribe</a>.</p></div>`;
  return { to: rec.email, subject: cat.reply.subject, html, text: textBody };
}

function teamAlertEmail(cat: InquiryCategory, rec: any, deps: InquiryDeps) {
  const rows: Array<[string, unknown]> = [
    ["Category", cat.label],
    ["Name", rec.name],
    ["Business", rec.businessName],
    ["Email", rec.email],
    ["Phone", rec.phone],
    ["Listing", rec.listingUrl],
    ["Message", rec.message],
    ["Inquiry", rec.inquiryId],
  ];
  const admin = `${deps.baseUrl.replace(/\/$/, "")}/admin/inquiries`;
  return {
    to: deps.teamEmail,
    subject: `New BWE inquiry: ${cat.label} (${rec.businessName || rec.name})`,
    text:
      rows
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n") + `\n\nAll inquiries: ${admin}`,
    html: `<div style="font-family:Arial,sans-serif;font-size:14px"><p><b>New inquiry: ${esc(cat.label)}</b></p><table>${rows
      .filter(([, v]) => v)
      .map(
        ([k, v]) =>
          `<tr><td style="color:#666;padding:2px 10px 2px 0;vertical-align:top">${esc(k)}</td><td style="white-space:pre-wrap">${esc(v)}</td></tr>`,
      )
      .join("")}</table><p><a href="${esc(admin)}">All inquiries</a></p></div>`,
  };
}

// Send one inquiry to Speed-to-Lead. Only what it needs: name, phone, email,
// the lead type and where it came from. No texting consent is collected on
// this form, so Speed-to-Lead alerts the team to call instead of texting.
export async function forwardToSpeedToLead(
  db: Db,
  rec: any,
  deps: InquiryDeps,
) {
  const now = deps.now();
  const attempts = Number(rec.speedToLead?.attempts || 0) + 1;
  let state: ForwardState,
    leadId: string | null = rec.speedToLead?.leadId || null,
    lastError: string | null = null,
    next: Date | null = null;
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 8000);
    const res = await deps
      .fetch(String(deps.speedToLeadUrl), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: rec.name,
          phone: rec.phone,
          email: rec.email,
          service_needed: rec.leadType,
          campaign: `bwe-inquiry-${rec.category}`,
          sms_consent: false,
        }),
        signal: ctl.signal,
      })
      .finally(() => clearTimeout(timer));
    if (res.ok) {
      const body: any = await res.json().catch(() => ({}));
      state = "sent";
      leadId = body?.data?.lead_id ? String(body.data.lead_id) : leadId;
    } else if (res.status === 503) {
      // BWE is not live in Speed-to-Lead yet (waiting on texting approval).
      state = "waiting_for_go_live";
      lastError = "http_503";
      next = new Date(now.getTime() + 24 * 3600 * 1000);
    } else if (res.status === 429 || res.status >= 500) {
      state = "retrying";
      lastError = `http_${res.status}`;
    } else {
      state = "failed";
      lastError = `http_${res.status}`;
    }
  } catch (e: any) {
    state = "retrying";
    lastError = e?.name === "AbortError" ? "timeout" : "network";
  }
  if (state === "retrying") {
    if (attempts >= 6) state = "failed";
    else next = new Date(now.getTime() + 15 * 60 * 1000 * 2 ** (attempts - 1));
  }
  // Waiting for go-live gives up after 45 days; the inquiry itself stays.
  if (
    state === "waiting_for_go_live" &&
    now.getTime() - new Date(rec.createdAt).getTime() > 45 * 24 * 3600 * 1000
  )
    state = "failed";
  const speedToLead = {
    state,
    attempts,
    leadId,
    lastError,
    nextAttemptAt: next,
    lastAttemptAt: now,
  };
  await db
    .collection("inquiries")
    .updateOne({ _id: rec._id }, { $set: { speedToLead, updatedAt: now } });
  return speedToLead;
}

export async function createInquiry(
  db: Db,
  input: InquiryInput,
  deps: InquiryDeps,
) {
  if (String(input.website ?? "").trim())
    return { ok: true as const, ignored: true as const };
  const v = validateInquiry(input);
  const now = deps.now();
  const cat = v.category;
  const inquiryId = `INQ-${now.getTime().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
  const forwardable =
    cat.sendToSpeedToLead && Boolean(v.phone) && Boolean(deps.speedToLeadUrl);
  const rec: any = {
    inquiryId,
    origin: "Black Wealth Exchange",
    category: cat.key,
    leadType: cat.leadType,
    name: v.name,
    businessName: v.businessName,
    email: v.email,
    phone: v.phone,
    message: v.message,
    listingUrl: v.listingUrl,
    sourceForm: v.sourceForm,
    status: "new",
    dedupeKey: dedupeKey(v.email, cat.key, now),
    reply: { state: "pending" },
    teamAlert: { state: cat.alertTeam ? "pending" : "not_applicable" },
    speedToLead: {
      state: forwardable ? "pending" : "not_applicable",
      reason: forwardable
        ? null
        : !cat.sendToSpeedToLead
          ? "category"
          : !v.phone
            ? "no_phone"
            : "not_configured",
      attempts: 0,
    },
    createdAt: now,
    updatedAt: now,
  };
  try {
    const r = await db.collection("inquiries").insertOne(rec);
    rec._id = r.insertedId;
  } catch (e: any) {
    if (e?.code === 11000) {
      const existing = await db
        .collection("inquiries")
        .findOne(
          { dedupeKey: rec.dedupeKey },
          { projection: { inquiryId: 1 } },
        );
      return {
        ok: true as const,
        duplicate: true as const,
        inquiryId: existing?.inquiryId || null,
      };
    }
    throw e;
  }

  // Everything below is best effort: the inquiry is already saved.
  const optedOut = Boolean(
    await db
      .collection("email_suppressions")
      .findOne({ email: v.email })
      .catch(() => null),
  );
  let reply: any;
  if (optedOut) reply = { state: "skipped_opted_out" };
  else {
    try {
      await deps.sendEmail(replyEmail(cat, rec, deps));
      reply = { state: "sent", at: deps.now() };
    } catch {
      reply = { state: "failed", at: deps.now() };
    }
  }
  let teamAlert: any = rec.teamAlert;
  if (cat.alertTeam) {
    try {
      await deps.sendEmail(teamAlertEmail(cat, rec, deps));
      teamAlert = { state: "sent", at: deps.now() };
    } catch {
      teamAlert = { state: "failed", at: deps.now() };
    }
  }
  await db
    .collection("inquiries")
    .updateOne(
      { _id: rec._id },
      { $set: { reply, teamAlert, optedOut, updatedAt: deps.now() } },
    );
  if (forwardable) await forwardToSpeedToLead(db, rec, deps).catch(() => null);
  return { ok: true as const, inquiryId, category: cat.key };
}

// Retries hand-offs that are due: temporary failures, and inquiries waiting
// for BWE to go live in Speed-to-Lead. Run daily, and after each new inquiry.
export async function processPendingForwards(
  db: Db,
  deps: InquiryDeps,
  limit = 25,
) {
  if (!deps.speedToLeadUrl) return { processed: 0 };
  const due = await db
    .collection("inquiries")
    .find({
      "speedToLead.state": {
        $in: ["pending", "retrying", "waiting_for_go_live"],
      },
      $or: [
        { "speedToLead.nextAttemptAt": null },
        { "speedToLead.nextAttemptAt": { $lte: deps.now() } },
      ],
    })
    .sort({ createdAt: 1 })
    .limit(limit)
    .toArray();
  for (const rec of due)
    await forwardToSpeedToLead(db, rec, deps).catch(() => null);
  return { processed: due.length };
}

export async function unsubscribeEmail(
  db: Db,
  email: string,
  token: string,
  secret: string,
) {
  const e = String(email || "")
    .trim()
    .toLowerCase();
  if (!EMAIL_RX.test(e) || token !== unsubscribeToken(e, secret)) return false;
  await db
    .collection("email_suppressions")
    .updateOne(
      { email: e },
      {
        $setOnInsert: {
          email: e,
          reason: "unsubscribed from inquiry email",
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );
  return true;
}

// Inquiries, hand-offs and the ones that became paying members (a non-test
// membership bought with the same email after the inquiry).
export async function inquirySummary(db: Db, since?: Date) {
  const match = since ? { createdAt: { $gte: since } } : {};
  const items = await db
    .collection("inquiries")
    .find(match, {
      projection: {
        inquiryId: 1,
        category: 1,
        email: 1,
        createdAt: 1,
        speedToLead: 1,
        reply: 1,
        optedOut: 1,
      },
    })
    .toArray();
  const emails = [...new Set(items.map((i: any) => i.email))];
  const members = emails.length
    ? await db
        .collection("business_memberships")
        .find(
          { email: { $in: emails }, isTestMembership: { $ne: true } },
          {
            projection: {
              email: 1,
              createdAt: 1,
              paymentAmountCents: 1,
              membershipStatus: 1,
            },
          },
        )
        .toArray()
    : [];
  const byCategory: Record<
    string,
    {
      inquiries: number;
      sentToSpeedToLead: number;
      converted: number;
      revenueCents: number;
    }
  > = {};
  const converted = new Set<string>();
  let revenueCents = 0;
  for (const i of items as any[]) {
    const b = (byCategory[i.category] ||= {
      inquiries: 0,
      sentToSpeedToLead: 0,
      converted: 0,
      revenueCents: 0,
    });
    b.inquiries++;
    if (i.speedToLead?.state === "sent") b.sentToSpeedToLead++;
    const m = (members as any[]).find(
      (x) =>
        x.email === i.email && new Date(x.createdAt) >= new Date(i.createdAt),
    );
    if (m && !converted.has(i.email)) {
      converted.add(i.email);
      b.converted++;
      b.revenueCents += Number(m.paymentAmountCents || 0);
      revenueCents += Number(m.paymentAmountCents || 0);
    }
  }
  const count = (f: (i: any) => boolean) => (items as any[]).filter(f).length;
  return {
    inquiries: items.length,
    byCategory,
    repliesSent: count((i) => i.reply?.state === "sent"),
    optedOut: count((i) => i.optedOut),
    speedToLead: {
      sent: count((i) => i.speedToLead?.state === "sent"),
      waitingForGoLive: count(
        (i) => i.speedToLead?.state === "waiting_for_go_live",
      ),
      retrying: count((i) =>
        ["pending", "retrying"].includes(i.speedToLead?.state),
      ),
      failed: count((i) => i.speedToLead?.state === "failed"),
    },
    convertedToMembers: converted.size,
    membershipRevenueCents: revenueCents,
  };
}
