// src/lib/businessApprovedEmail.ts
//
// The "you're live" email sent when an admin approves a business: thanks
// them for joining, links the live listing, and gently invites them to
// claim it (the paid Founding membership). Sent once per business.

import type { Collection } from "mongodb";
import { getBaseUrl } from "@/lib/seo";
import { sendEmail } from "@/lib/sendEmail";

function s(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function approvedEmailRecipient(doc: Record<string, any>): string {
  return s(doc?.businessEmail) || s(doc?.email);
}

function firstName(doc: Record<string, any>): string {
  const full =
    s(doc?.claimantVerification?.claimantName) ||
    s(doc?.ownerName) ||
    s(doc?.firstName) ||
    s(doc?.blackOwnedVerification?.owners?.[0]?.ownerName);
  return full.split(/\s+/)[0] || "";
}

export function buildBusinessApprovedEmail(args: {
  doc: Record<string, any>;
  businessName: string;
  alias: string;
  baseUrl?: string;
}) {
  // Customers must never get a localhost link, whatever the env settings are.
  const base = (
    args.baseUrl ||
    (process.env.NODE_ENV === "production"
      ? "https://www.blackwealthexchange.com"
      : getBaseUrl())
  ).replace(/\/$/, "");
  const listingUrl = `${base}/business-directory/${encodeURIComponent(args.alias)}`;
  const claimUrl = `${base}/founding-membership?businessId=${encodeURIComponent(String(args.doc?._id || ""))}`;
  const name = firstName(args.doc);
  const greeting = name ? `Hi ${name},` : "Hi there,";
  const business = args.businessName;

  const subject = `${business} is now live on Black Wealth Exchange`;
  const text = `${greeting}

Thank you for joining Black Wealth Exchange. We're glad to have ${business} in the community.

Your listing has been reviewed and approved, and it's now live in our directory, where people looking to support Black-owned businesses can find you:
${listingUrl}

One quick tip: listings with a photo or logo get noticed more. You can add one any time by signing in and updating your profile.

When you're ready, you can also claim your listing. Claiming confirms you as the owner and gives you a professional review of your profile, help strengthening it, and a monthly report on how it's doing. There's no rush, and your listing stays up either way. If it sounds helpful, you can learn more here:
${claimUrl}

If you have any questions, just reply to this email. We're happy to help.

With gratitude,
Thomas Hooker
Black Wealth Exchange`;

  const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1a1a1a;max-width:600px">
<p>${escapeHtml(greeting)}</p>
<p>Thank you for joining Black Wealth Exchange. We're glad to have ${escapeHtml(business)} in the community.</p>
<p>Your listing has been reviewed and approved, and it's now live in our directory, where people looking to support Black-owned businesses can find you:<br><a href="${escapeHtml(listingUrl)}">View your listing</a></p>
<p>One quick tip: listings with a photo or logo get noticed more. You can add one any time by signing in and updating your profile.</p>
<p>When you're ready, you can also claim your listing. Claiming confirms you as the owner and gives you a professional review of your profile, help strengthening it, and a monthly report on how it's doing. There's no rush, and your listing stays up either way. If it sounds helpful, you can <a href="${escapeHtml(claimUrl)}">learn more here</a>.</p>
<p>If you have any questions, just reply to this email. We're happy to help.</p>
<p>With gratitude,<br>Thomas Hooker<br>Black Wealth Exchange</p>
</div>`;

  return { subject, text, html, listingUrl, claimUrl };
}

// Sends the email unless it already went out, and records when it did.
// Never throws: a mail problem must not undo or fail the approval.
export async function sendBusinessApprovedEmail(args: {
  businesses: Collection<any>;
  doc: Record<string, any>;
  businessName: string;
  alias: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const { businesses, doc } = args;
  if (doc?.approvalEmailSentAt) return { sent: false, reason: "already_sent" };
  const to = approvedEmailRecipient(doc);
  if (!to) return { sent: false, reason: "no_email" };

  try {
    const email = buildBusinessApprovedEmail(args);
    await sendEmail({
      to,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });
    await businesses.updateOne(
      { _id: doc._id },
      { $set: { approvalEmailSentAt: new Date(), approvalEmailSentTo: to } },
    );
    return { sent: true };
  } catch (err) {
    console.error("[businessApprovedEmail] send failed:", err);
    return { sent: false, reason: "send_failed" };
  }
}
