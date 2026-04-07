import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { sendEmail } from "@/lib/sendEmail";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";

function emailForStatus(status: string, fullName?: string) {
  const name = fullName || "there";

  if (status === "accepted") {
    return {
      subject: "You’re Accepted — Black Wealth Exchange Internship",
      html: `
        <p>Hi ${name},</p>
        <p>Congratulations — you’ve been <b>accepted</b> to join Black Wealth Exchange.</p>
        <p>Next steps:</p>
        <ol>
          <li>Reply to confirm you’re still available.</li>
          <li>We’ll send onboarding + your first assignment.</li>
        </ol>
        <p>— Black Wealth Exchange</p>
      `,
    };
  }

  if (status === "contacted") {
    return {
      subject: "Next Steps — Black Wealth Exchange Internship",
      html: `
        <p>Hi ${name},</p>
        <p>Thanks for applying. We’d like to move forward.</p>
        <p>Please reply with 2–3 times you’re available to talk this week.</p>
        <p>— Black Wealth Exchange</p>
      `,
    };
  }

  if (status === "reviewed") {
    return {
      subject: "Application Update — Black Wealth Exchange",
      html: `
        <p>Hi ${name},</p>
        <p>Your application has been <b>reviewed</b>. If we need anything else, we’ll reach out.</p>
        <p>— Black Wealth Exchange</p>
      `,
    };
  }

  if (status === "rejected") {
    return {
      subject: "Application Update — Black Wealth Exchange",
      html: `
        <p>Hi ${name},</p>
        <p>Thank you for applying. At this time, we won’t be moving forward.</p>
        <p>Please keep an eye on future openings — we appreciate your interest.</p>
        <p>— Black Wealth Exchange</p>
      `,
    };
  }

  return null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  const client = await clientPromise;
  const db = client.db(getMongoDbName());

  await ensureApiRateLimitIndexes(db);
  const ip = getClientIp(req);
  const ipLimit = await hitApiRateLimit(
    db,
    `admin:intern-applications:ip:${ip}`,
    60,
    5,
  );
  if (ipLimit.blocked) {
    res.setHeader("Retry-After", String(ipLimit.retryAfterSeconds));
    return res.status(429).json({ error: "Too many requests" });
  }

  const col = db.collection("intern_applications");

  if (req.method === "GET") {
    const limitRaw = Number(req.query.limit ?? 200);
    const limit = Number.isFinite(limitRaw)
      ? Math.max(1, Math.min(500, Math.floor(limitRaw)))
      : 200;

    const data = await col
      .find(
        {},
        {
          projection: {
            fullName: 1,
            email: 1,
            phone: 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1,
            roleInterest: 1,
          },
        },
      )
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    return res.json({ ok: true, meta: { limit }, applications: data });
  }

  if (req.method === "PATCH") {
    const { id, status, adminNote } = req.body as {
      id: string;
      status: string;
      adminNote?: string;
    };
    if (!id || !status)
      return res.status(400).json({ error: "Missing id/status" });

    // Get the current doc so we can email the right person + avoid duplicates
    const existing = await col.findOne({ _id: new ObjectId(id) });
    if (!existing)
      return res.status(404).json({ error: "Application not found" });

    // Update status
    await col.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status,
          adminNote:
            typeof adminNote === "string"
              ? adminNote.trim().slice(0, 1200)
              : "",
          reviewedBy: admin.email || admin.userId || "admin",
          updatedAt: new Date(),
        },
      },
    );

    // Only email for certain statuses
    const emailPayload = emailForStatus(status, existing.fullName);

    let emailSent = false;
    let emailError: string | null = null;

    if (emailPayload?.subject && existing.email) {
      try {
        await sendEmail({
          to: existing.email,
          subject: emailPayload.subject,
          html: emailPayload.html,
        });
        emailSent = true;
      } catch (err: any) {
        emailError = err?.message || "Email failed";
        console.error("Email send error:", err);
      }
    }

    return res.json({ success: true, emailSent, emailError });
  }

  if (req.method === "DELETE") {
    const { id, reason } = req.body as { id?: string; reason?: string };
    if (!id) return res.status(400).json({ error: "Missing id" });
    const result = await col.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "deleted",
          deletedAt: new Date(),
          updatedAt: new Date(),
          reviewedBy: admin.email || admin.userId || "admin",
          adminNote:
            typeof reason === "string" && reason.trim()
              ? reason.trim().slice(0, 1200)
              : "Deleted by admin",
        },
      },
    );
    if (!result.matchedCount)
      return res.status(404).json({ error: "Application not found" });
    return res.json({ ok: true, id, status: "deleted" });
  }

  res.setHeader("Allow", ["GET", "PATCH", "DELETE"]);
  res.status(405).end();
}
