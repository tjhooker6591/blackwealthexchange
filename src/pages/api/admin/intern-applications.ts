import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import { sendEmail } from "@/lib/sendEmail";

const SECRET = process.env.JWT_SECRET!;

function requireAdmin(req: NextApiRequest) {
  const cookies = cookie.parse(req.headers.cookie || "");
  const token = cookies.session_token;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, SECRET) as any;
    return payload.isAdmin ? payload : null;
  } catch {
    return null;
  }
}

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
  const admin = requireAdmin(req);
  if (!admin) return res.status(401).json({ error: "Admin only" });

  const client = await clientPromise;
  const db = client.db("bwes-cluster");
  const col = db.collection("intern_applications");

  if (req.method === "GET") {
    const data = await col.find().sort({ createdAt: -1 }).toArray();
    return res.json(data);
  }

  if (req.method === "PATCH") {
    const { id, status } = req.body as { id: string; status: string };
    if (!id || !status)
      return res.status(400).json({ error: "Missing id/status" });

    // Get the current doc so we can email the right person + avoid duplicates
    const existing = await col.findOne({ _id: new ObjectId(id) });
    if (!existing)
      return res.status(404).json({ error: "Application not found" });

    // Update status
    await col.updateOne({ _id: new ObjectId(id) }, { $set: { status } });

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

  res.status(405).end();
}
