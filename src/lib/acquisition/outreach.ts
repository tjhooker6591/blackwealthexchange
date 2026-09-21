// src/lib/acquisition/outreach.ts
//
// Automated outreach for the acquisition queue: one prospect at a time,
// explicitly added by an admin -- never a bulk/blast sender, never scrapes
// or auto-adds prospects on its own. Three pieces:
//
// 1. sendInitialOutreach() -- fires once, right after a prospect with a
//    contactEmail is created. Auto-creates a private preview (honestly
//    sparse if we don't have real business data -- never fabricated) and
//    emails it, then advances the prospect to "contacted".
// 2. recordInterested() -- called by the public "I'm interested" button on
//    the preview page. Advances the prospect to "replied" and notifies the
//    admin. This is the one moment a human is expected to act.
// 3. runFollowUpScan() -- meant to run on a daily schedule. Sends up to 2
//    follow-up nudges to prospects who've gone quiet, then stops on its
//    own. Never touches a prospect with doNotContact set, a non-"active"
//    lossState, or one that's already moved past "contacted".
//
// Every email send is wrapped so a delivery failure can never crash the
// caller (prospect creation, the public interested-click) -- it's logged
// as an activity instead, visible in the admin queue.

import { ObjectId, type Db } from "mongodb";
import { sendEmail } from "@/lib/sendEmail";
import { COLLECTIONS, nowIso, resolveCanonicalBusiness, s } from "./shared";
import { createPreview } from "./previews";
import { transitionProspectStage } from "./prospects";

function toStringId(id: unknown) {
  if (id instanceof ObjectId) return id.toString();
  return String(id);
}

function adminRecipients(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

async function logActivity(
  db: Db,
  prospectId: string,
  note: string,
  actorId = "system:acquisition-outreach",
) {
  await db.collection(COLLECTIONS.activities).insertOne({
    prospectId,
    fromStage: null,
    toStage: null,
    actorId,
    actorEmail: actorId,
    note,
    timestamp: nowIso(),
  });
}

export async function sendInitialOutreach(
  db: Db,
  prospectId: string,
): Promise<{ ok: true } | { ok: false; code: string; message: string }> {
  if (!ObjectId.isValid(prospectId)) {
    return { ok: false, code: "INVALID_ID", message: "Invalid prospect id." };
  }
  const prospect = await db
    .collection(COLLECTIONS.prospects)
    .findOne({ _id: new ObjectId(prospectId) });
  if (!prospect) {
    return { ok: false, code: "NOT_FOUND", message: "Prospect not found." };
  }
  const contactEmail = s((prospect as any).contactEmail);
  if (!contactEmail) {
    return {
      ok: false,
      code: "NO_CONTACT_EMAIL",
      message: "No contact email on file; automated outreach skipped.",
    };
  }

  const displayName =
    s((prospect as any).externalProspectName) || "your business";
  const missingFacts: string[] = [];
  const proposedFields: {
    field: string;
    value: string;
    isProposed: boolean;
  }[] = [];

  if ((prospect as any).businessId) {
    const canonical = await resolveCanonicalBusiness(
      db,
      s((prospect as any).businessId),
    );
    if (canonical) {
      proposedFields.push({
        field: "Business name",
        value: canonical.name,
        isProposed: false,
      });
    } else {
      missingFacts.push("Business name could not be confirmed yet.");
    }
  } else {
    proposedFields.push({
      field: "Business name",
      value: displayName,
      isProposed: true,
    });
    missingFacts.push(
      "This business is not yet in the BWE directory -- profile details still need to be confirmed with the owner.",
    );
  }

  const previewResult = await createPreview(db, {
    prospectId,
    businessId: s((prospect as any).businessId) || "",
    proposedFields,
    missingFacts,
    actorId: "system:acquisition-outreach",
  });

  if (!previewResult.ok) {
    await logActivity(
      db,
      prospectId,
      `Automated outreach failed: could not create preview (${previewResult.code}).`,
    );
    return previewResult;
  }

  const baseUrl = (process.env.PUBLIC_BASE_URL || "").replace(/\/$/, "");
  const previewUrl = `${baseUrl}/preview/${previewResult.preview.accessToken}`;

  try {
    await sendEmail({
      to: contactEmail,
      subject: `${displayName} on Black Wealth Exchange`,
      text: `Hi,\n\nWe put together a preview of how ${displayName} could look on Black Wealth Exchange -- a directory built to connect real buyers with Black-owned businesses.\n\nTake a look, no commitment: ${previewUrl}\n\nIf you're interested, there's a button on that page to let us know.\n\n-- Black Wealth Exchange`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
          <div style="max-width: 640px; margin: 0 auto; padding: 24px;">
            <h2 style="margin: 0 0 12px;">${displayName} on Black Wealth Exchange</h2>
            <p style="margin: 0 0 16px;">We put together a preview of how ${displayName} could look on Black Wealth Exchange -- a directory built to connect real buyers with Black-owned businesses.</p>
            <div style="margin: 20px 0;">
              <a href="${previewUrl}" style="display:inline-block; padding: 12px 16px; text-decoration:none; border-radius: 8px; background:#111; color:#FFD700; font-weight:600;">
                View your preview
              </a>
            </div>
            <p style="margin: 0 0 16px; font-size: 13px; color: #555;">No commitment -- if you're interested, there's a button on that page to let us know.</p>
          </div>
        </div>
      `,
    });
  } catch (err: any) {
    await logActivity(
      db,
      prospectId,
      `Automated outreach email failed to send: ${err?.message || "unknown error"}.`,
    );
    return {
      ok: false,
      code: "EMAIL_SEND_FAILED",
      message: err?.message || "Email send failed.",
    };
  }

  await logActivity(
    db,
    prospectId,
    `Automated outreach email sent to ${contactEmail} with preview link.`,
  );

  const transition = await transitionProspectStage(db, {
    prospectId,
    toStage: "contacted",
    note: "Advanced automatically after initial outreach email sent.",
    actorId: "system:acquisition-outreach",
    actorEmail: "system:acquisition-outreach",
  });
  if (!transition.ok) return transition;

  return { ok: true };
}

export async function recordInterested(
  db: Db,
  token: string,
): Promise<{ ok: true } | { ok: false; code: string; message: string }> {
  const preview = await db
    .collection(COLLECTIONS.previews)
    .findOne({ accessToken: s(token) });
  if (!preview) {
    return { ok: false, code: "NOT_FOUND", message: "Preview not found." };
  }
  const prospectId = s((preview as any).prospectId);
  if (!prospectId || !ObjectId.isValid(prospectId)) {
    return {
      ok: false,
      code: "NOT_FOUND",
      message: "No prospect linked to this preview.",
    };
  }
  const prospect = await db
    .collection(COLLECTIONS.prospects)
    .findOne({ _id: new ObjectId(prospectId) });
  if (!prospect) {
    return { ok: false, code: "NOT_FOUND", message: "Prospect not found." };
  }

  // Idempotent: clicking twice doesn't double-log or re-notify the admin.
  const alreadyReplied =
    (prospect as any).stage !== "researched" &&
    (prospect as any).stage !== "contacted";
  if (!alreadyReplied) {
    const transition = await transitionProspectStage(db, {
      prospectId,
      toStage: "replied",
      note: 'Business clicked "I\'m interested" on their private preview.',
      actorId: "system:acquisition-outreach",
      actorEmail: "system:acquisition-outreach",
    });
    if (!transition.ok) return transition;

    const displayName =
      s((prospect as any).externalProspectName) || "A prospect";
    const recipients = adminRecipients();
    if (recipients.length) {
      try {
        await sendEmail({
          to: recipients.join(","),
          subject: `${displayName} is interested -- BWE acquisition queue`,
          text: `${displayName} just clicked "I'm interested" on their private preview. Go take a look in the admin growth queue and follow up.`,
          html: `<p><strong>${displayName}</strong> just clicked "I'm interested" on their private preview. Go take a look in the admin growth queue and follow up.</p>`,
        });
      } catch (err: any) {
        await logActivity(
          db,
          prospectId,
          `Admin notification email failed to send: ${err?.message || "unknown error"}.`,
        );
      }
    }
  }

  return { ok: true };
}

const MAX_AUTOMATED_FOLLOW_UPS = 2;
const FOLLOW_UP_INTERVAL_DAYS = 3;

export async function runFollowUpScan(
  db: Db,
): Promise<{ checked: number; sent: number; skipped: number }> {
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

  for (const prospect of candidates) {
    const prospectId = toStringId((prospect as any)._id);
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
    const displayName =
      s((prospect as any).externalProspectName) || "your business";
    const contactEmail = s((prospect as any).contactEmail);

    const latestPreview = await db
      .collection(COLLECTIONS.previews)
      .find({ prospectId })
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();
    const token = latestPreview[0]
      ? s((latestPreview[0] as any).accessToken)
      : null;
    const baseUrl = (process.env.PUBLIC_BASE_URL || "").replace(/\/$/, "");
    const previewUrl = token ? `${baseUrl}/preview/${token}` : baseUrl;

    try {
      await sendEmail({
        to: contactEmail,
        subject: `Still interested in ${displayName} joining Black Wealth Exchange?`,
        text: `Hi,\n\nJust following up -- here's the preview we put together for ${displayName}: ${previewUrl}\n\nNo pressure either way, just wanted to check in.\n\n-- Black Wealth Exchange`,
        html: `<div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;"><div style="max-width: 640px; margin: 0 auto; padding: 24px;"><p>Just following up -- here's the preview we put together for <strong>${displayName}</strong>.</p><div style="margin: 20px 0;"><a href="${previewUrl}" style="display:inline-block; padding: 12px 16px; text-decoration:none; border-radius: 8px; background:#111; color:#FFD700; font-weight:600;">View your preview</a></div><p style="font-size: 13px; color: #555;">No pressure either way, just wanted to check in.</p></div></div>`,
      });
      await db
        .collection(COLLECTIONS.prospects)
        .updateOne(
          { _id: (prospect as any)._id },
          { $set: { lastActivityAt: nowIso(), updatedAt: nowIso() } },
        );
      await logActivity(
        db,
        prospectId,
        `Automated follow-up #${followUpNumber} sent.`,
      );
      sent++;
    } catch (err: any) {
      await logActivity(
        db,
        prospectId,
        `Automated follow-up #${followUpNumber} failed to send: ${err?.message || "unknown error"}.`,
      );
      skipped++;
    }
  }

  return { checked: candidates.length, sent, skipped };
}
