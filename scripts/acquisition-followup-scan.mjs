#!/usr/bin/env node
// scripts/acquisition-followup-scan.mjs
//
// BWE Acquisition & Proof -- automated follow-up nudges. Sends up to 2
// follow-up emails to prospects who've gone quiet in "contacted" stage for
// 3+ days, then stops on its own. Never touches a prospect with
// doNotContact set, a non-"active" lossState, one that's moved past
// "contacted", or one with no contactEmail on file. This never adds new
// prospects or sends the *first* outreach email -- that fires immediately
// when an admin adds a prospect (src/lib/acquisition/outreach.ts), one at
// a time, never in bulk. This script is the quiet daily follow-up only.
//
// Mirrors src/lib/acquisition/outreach.ts#runFollowUpScan's logic in plain
// Node (no TS/Next.js runtime available in a standalone cron script) --
// same thresholds, same query shape. Follows this repo's existing
// scheduled-script convention (see scripts/network-alerts-scan.mjs).
//
// Usage: node scripts/acquisition-followup-scan.mjs [--dry-run]

import { MongoClient } from "mongodb";
import nodemailer from "nodemailer";
import fs from "node:fs";

function mongoUri() {
  return (
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    (() => {
      try {
        const t = fs.readFileSync("connect.js", "utf8");
        const m = t.match(/"mongodb\+srv:[^"]+"/);
        return m ? m[0].slice(1, -1) : "";
      } catch {
        return "";
      }
    })()
  );
}

const DRY_RUN = process.argv.includes("--dry-run");
const MAX_AUTOMATED_FOLLOW_UPS = 2;
const FOLLOW_UP_INTERVAL_DAYS = 3;

const COLLECTIONS = {
  prospects: "acquisition_prospects",
  activities: "acquisition_prospect_activities",
  previews: "acquisition_previews",
};

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;
  if (!host || !user || !pass || !from) return null;
  return { host, port, secure: port === 465, user, pass, from };
}

async function sendEmail(smtp, { to, subject, html, text }) {
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.user, pass: smtp.pass },
  });
  await transporter.verify();
  return transporter.sendMail({
    from: `"Black Wealth Exchange" <${smtp.from}>`,
    to,
    subject,
    text,
    html,
  });
}

async function main() {
  const uri = mongoUri();
  if (!uri) throw new Error("Missing MONGODB_URI.");
  const smtp = getSmtpConfig();
  if (!smtp && !DRY_RUN) {
    console.log(
      "[acquisition-followup-scan] SMTP not configured -- nothing to send, exiting cleanly.",
    );
    return;
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "bwes-cluster");

  const cutoff = new Date(
    Date.now() - FOLLOW_UP_INTERVAL_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const candidates = await db
    .collection(COLLECTIONS.prospects)
    .find({
      stage: "contacted",
      lossState: "active",
      doNotContact: { $ne: true },
      contactEmail: { $ne: null },
      lastActivityAt: { $lte: cutoff },
    })
    .limit(200)
    .toArray();

  let sent = 0;
  let skipped = 0;
  const baseUrl = (process.env.PUBLIC_BASE_URL || "").replace(/\/$/, "");

  for (const prospect of candidates) {
    const prospectId = String(prospect._id);
    const priorFollowUps = await db
      .collection(COLLECTIONS.activities)
      .countDocuments({
        prospectId,
        note: { $regex: /^Automated follow-up #\d+ sent\./ },
      });

    if (priorFollowUps >= MAX_AUTOMATED_FOLLOW_UPS) {
      skipped++;
      continue;
    }

    const followUpNumber = priorFollowUps + 1;
    const displayName = prospect.externalProspectName || "your business";
    const contactEmail = String(prospect.contactEmail || "").trim();
    if (!contactEmail) {
      skipped++;
      continue;
    }

    const latestPreview = await db
      .collection(COLLECTIONS.previews)
      .find({ prospectId })
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();
    const token = latestPreview[0]?.accessToken || null;
    const previewUrl = token ? `${baseUrl}/preview/${token}` : baseUrl;

    if (DRY_RUN) {
      console.log(
        `[dry-run] would send follow-up #${followUpNumber} to ${contactEmail} (prospect ${prospectId})`,
      );
      sent++;
      continue;
    }

    try {
      await sendEmail(smtp, {
        to: contactEmail,
        subject: `Still interested in ${displayName} joining Black Wealth Exchange?`,
        text: `Hi,\n\nJust following up -- here's the preview we put together for ${displayName}: ${previewUrl}\n\nNo pressure either way, just wanted to check in.\n\n-- Black Wealth Exchange`,
        html: `<div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;"><div style="max-width: 640px; margin: 0 auto; padding: 24px;"><p>Just following up -- here's the preview we put together for <strong>${displayName}</strong>.</p><div style="margin: 20px 0;"><a href="${previewUrl}" style="display:inline-block; padding: 12px 16px; text-decoration:none; border-radius: 8px; background:#111; color:#FFD700; font-weight:600;">View your preview</a></div><p style="font-size: 13px; color: #555;">No pressure either way, just wanted to check in.</p></div></div>`,
      });
      const now = new Date().toISOString();
      await db
        .collection(COLLECTIONS.prospects)
        .updateOne(
          { _id: prospect._id },
          { $set: { lastActivityAt: now, updatedAt: now } },
        );
      await db.collection(COLLECTIONS.activities).insertOne({
        prospectId,
        fromStage: null,
        toStage: null,
        actorId: "system:acquisition-followup-scan",
        actorEmail: "system:acquisition-followup-scan",
        note: `Automated follow-up #${followUpNumber} sent.`,
        timestamp: now,
      });
      sent++;
    } catch (err) {
      await db.collection(COLLECTIONS.activities).insertOne({
        prospectId,
        fromStage: null,
        toStage: null,
        actorId: "system:acquisition-followup-scan",
        actorEmail: "system:acquisition-followup-scan",
        note: `Automated follow-up #${followUpNumber} failed to send: ${err?.message || "unknown error"}.`,
        timestamp: new Date().toISOString(),
      });
      skipped++;
    }
  }

  console.log(
    `[acquisition-followup-scan] checked=${candidates.length} sent=${sent} skipped=${skipped}${DRY_RUN ? " (dry-run)" : ""}`,
  );

  await client.close();
}

main().catch((err) => {
  console.error("[acquisition-followup-scan] failed:", err);
  process.exit(1);
});
