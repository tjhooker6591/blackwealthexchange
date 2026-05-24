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
  const tickets = db.collection("support_tickets");

  if (req.method === "GET") {
    const ticket = await tickets.findOne(
      { ticketId: id },
      {
        projection: {
          internalNotes: 1,
          publicReplies: 1,
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
          relatedJobId: 1,
          relatedAdCampaignId: 1,
          status: 1,
          assignedTo: 1,
          escalationLevel: 1,
          createdAt: 1,
          updatedAt: 1,
          firstResponseAt: 1,
          resolvedAt: 1,
          emailEvents: 1,
          lastUpdatedBy: 1,
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
    const followUpMessage = String(body.followUpMessage || "").trim();

    if (status && !SUPPORT_STATUSES.includes(status as any)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const existing: any = await tickets.findOne(
      { ticketId: id },
      {
        projection: {
          email: 1,
          subject: 1,
          status: 1,
          firstResponseAt: 1,
        },
      },
    );

    if (!existing) return res.status(404).json({ error: "Not found" });

    const adminIdentity = admin.email || admin.userId || "admin";

    const update: any = {
      updatedAt: new Date(),
      lastUpdatedBy: adminIdentity,
    };

    if (status) update.status = status;
    if (assignedTo || assignedTo === "") update.assignedTo = assignedTo;
    if (escalationLevel || escalationLevel === "") {
      update.escalationLevel = escalationLevel;
    }
    if (status === "Resolved" || status === "Closed") {
      update.resolvedAt = new Date();
    }

    const push: any = {};

    if (internalNote) {
      push.internalNotes = {
        note: internalNote,
        at: new Date(),
        by: adminIdentity,
      };
    }

    if (followUpMessage.length >= 3) {
      push.publicReplies = {
        from: "admin",
        message: followUpMessage,
        at: new Date(),
        by: adminIdentity,
      };
    }

    if (followUpMessage.length >= 3 && !existing.firstResponseAt) {
      update.firstResponseAt = new Date();
    }

    await tickets.updateOne(
      { ticketId: id },
      {
        $set: update,
        ...(Object.keys(push).length ? { $push: push } : {}),
      },
    );

    let emailNotification: any = {
      attempted: false,
      sent: false,
    };

    const shouldEmail =
      (followUpMessage.length >= 3 || status === "Waiting on User") &&
      existing?.email;

    if (shouldEmail) {
      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      const ticketUrl = `${baseUrl}/support/tickets/${encodeURIComponent(id)}`;

      const subjectLine =
        followUpMessage.length >= 3
          ? `Support follow-up for ticket ${id}`
          : `Action needed for support ticket ${id}`;

      const text =
        followUpMessage.length >= 3
          ? `${followUpMessage}\n\nReply here: ${ticketUrl}`
          : `Your support ticket ${id} is waiting on your response.\n\nOpen your ticket: ${ticketUrl}`;

      const html = `<div style="font-family:Arial,sans-serif;line-height:1.5;"><p>${
        followUpMessage.length >= 3
          ? followUpMessage
          : "Your ticket is waiting on your response."
      }</p><p><a href="${ticketUrl}">Open ticket</a></p></div>`;

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
      } catch (e: any) {
        emailNotification.error = String(
          e?.message || e || "Email send failed",
        ).slice(0, 300);
      }

      const emailEvent = {
        at: new Date(),
        type:
          followUpMessage.length >= 3 ? "admin_follow_up" : "waiting_on_user",
        to: existing.email,
        sent: emailNotification.sent,
        error: emailNotification.error || null,
        by: adminIdentity,
      };

      await tickets.updateOne({ ticketId: id }, {
        $push: {
          emailEvents: emailEvent,
        },
      } as any);
    }

    return res.status(200).json({
      ok: true,
      emailNotification,
      replySaved: followUpMessage.length >= 3,
    });
  }

  res.setHeader("Allow", ["GET", "PATCH"]);
  return res.status(405).json({ error: "Method not allowed" });
}
