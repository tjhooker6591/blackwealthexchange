import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { SUPPORT_STATUSES } from "@/lib/support";
import { sendEmail } from "@/lib/sendEmail";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;
  const id = String(req.query.id || "").trim();
  if (!id) return res.status(400).json({ error: "id required" });

  const db = (await clientPromise).db(getMongoDbName());

  if (req.method === "GET") {
    const ticket = await db.collection("support_tickets").findOne(
      { ticketId: id },
      {
        projection: {
          internalNotes: 1,
          ticketId: 1,
          userId: 1,
          accountType: 1,
          name: 1,
          email: 1,
          category: 1,
          priority: 1,
          subject: 1,
          message: 1,
          relatedOrderId: 1,
          relatedPaymentId: 1,
          relatedBusinessId: 1,
          relatedProductId: 1,
          status: 1,
          assignedTo: 1,
          createdAt: 1,
          updatedAt: 1,
          emailEvents: 1,
        },
      },
    );
    if (!ticket) return res.status(404).json({ error: "Not found" });
    return res.status(200).json({ ok: true, ticket });
  }

  if (req.method === "PATCH") {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};
    const status = String(body.status || "").trim();
    const internalNote = String(body.internalNote || "").trim();
    const assignedTo = String(body.assignedTo || "").trim();
    const escalationLevel = String(body.escalationLevel || "").trim();
    if (status && !SUPPORT_STATUSES.includes(status as any)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const update: any = { updatedAt: new Date() };
    if (status) update.status = status;
    if (assignedTo) update.assignedTo = assignedTo;
    if (escalationLevel) update.escalationLevel = escalationLevel;
    const push: any = {};
    if (internalNote)
      push.internalNotes = {
        note: internalNote,
        at: new Date(),
        by: admin.email || admin.userId || "admin",
      };
    const tickets = db.collection("support_tickets");
    const existing = await tickets.findOne(
      { ticketId: id },
      { projection: { ticketId: 1, email: 1, subject: 1, status: 1 } },
    );

    const pushUpdate: any = { ...(internalNote ? push : {}) };

    await tickets.updateOne(
      { ticketId: id },
      {
        $set: update,
        ...(Object.keys(pushUpdate).length ? { $push: pushUpdate } : {}),
      },
    );

    let emailNotification: {
      attempted: boolean;
      sent: boolean;
      to?: string;
      error?: string;
    } = { attempted: false, sent: false };

    if (
      existing?.email &&
      status &&
      status !== existing.status &&
      status.toLowerCase() === "waiting on user"
    ) {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      const ticketUrl = `${baseUrl}/support/tickets/${encodeURIComponent(id)}`;
      const subjectLine = `Action needed for support ticket ${id}`;
      const ticketSubject = existing.subject || "Support request";
      const text = [
        `Your support ticket ${id} is waiting on your response.`,
        `Subject: ${ticketSubject}`,
        `Open your ticket: ${ticketUrl}`,
      ].join("\n\n");
      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
          <h2>Support update from Black Wealth Exchange</h2>
          <p>Your ticket <strong>${id}</strong> is now marked <strong>Waiting on User</strong>.</p>
          <p><strong>Subject:</strong> ${ticketSubject}</p>
          <p>Please reply so we can keep helping you.</p>
          <p><a href="${ticketUrl}">Open your ticket</a></p>
        </div>
      `;

      emailNotification = {
        attempted: true,
        sent: false,
        to: existing.email,
      };

      try {
        await sendEmail({
          to: existing.email,
          subject: subjectLine,
          text,
          html,
        });
        emailNotification.sent = true;
      } catch (mailErr: any) {
        emailNotification.error =
          String(mailErr?.message || mailErr || "Email send failed").slice(
            0,
            300,
          );
        console.error("[admin/support] email send failed", {
          ticketId: id,
          to: existing.email,
          error: mailErr,
        });
      }

      await tickets.updateOne(
        { ticketId: id },
        {
          $push: {
            emailEvents: {
              at: new Date(),
              type: "waiting_on_user",
              to: existing.email,
              sent: emailNotification.sent,
              error: emailNotification.error || null,
              by: admin.email || admin.userId || "admin",
            },
          },
          $set: { updatedAt: new Date() },
        },
      );
    }

    return res.status(200).json({ ok: true, emailNotification });
  }

  res.setHeader("Allow", ["GET", "PATCH"]);
  return res.status(405).json({ error: "Method not allowed" });
}
