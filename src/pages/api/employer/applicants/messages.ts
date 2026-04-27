import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import { parse } from "cookie";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getJwtSecret } from "@/lib/env";

type HiringStatus =
  | "new"
  | "reviewed"
  | "shortlisted"
  | "contacted"
  | "rejected";

async function getEmployerContext(req: NextApiRequest) {
  const token = parse(req.headers.cookie || "").session_token;
  if (!token) throw new Error("401");
  const secret = getJwtSecret();
  const payload = jwt.verify(token, secret) as {
    email?: string;
    accountType?: string;
  };
  if (payload.accountType !== "employer") throw new Error("403");
  return { email: String(payload.email || "").toLowerCase() };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const employer = await getEmployerContext(req);
    const applicantId =
      typeof req.query.applicantId === "string"
        ? req.query.applicantId
        : req.body?.applicantId;
    if (!ObjectId.isValid(applicantId || "")) {
      return res.status(400).json({ error: "Invalid applicantId" });
    }

    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    const applicant = await db
      .collection("applicants")
      .findOne(
        { _id: new ObjectId(String(applicantId)) },
        { projection: { jobId: 1, hiringStatus: 1, email: 1 } },
      );
    if (!applicant?.jobId)
      return res.status(404).json({ error: "Applicant not found" });

    const job = await db
      .collection("jobs")
      .findOne(
        { _id: applicant.jobId },
        { projection: { employerEmail: 1, email: 1, title: 1 } },
      );

    const ownerEmail = String(
      job?.employerEmail || job?.email || "",
    ).toLowerCase();
    if (!job || ownerEmail !== employer.email)
      return res.status(403).json({ error: "Access denied" });

    if (req.method === "GET") {
      const messages = await db
        .collection("applicant_messages")
        .find({ applicantId: new ObjectId(String(applicantId)) })
        .sort({ createdAt: 1 })
        .limit(200)
        .toArray();

      return res.status(200).json({
        messages: messages.map((m: any) => ({
          _id: String(m._id),
          senderRole: m.senderRole,
          sender: m.sender,
          body: m.body,
          createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : "",
        })),
      });
    }

    if (req.method === "POST") {
      const status = (applicant.hiringStatus || "new") as HiringStatus;
      if (!["shortlisted", "contacted"].includes(status)) {
        return res.status(400).json({
          error: "Messaging allowed only for shortlisted/contacted applicants",
        });
      }

      const body =
        typeof req.body?.body === "string"
          ? req.body.body.trim().slice(0, 2000)
          : "";
      if (!body)
        return res.status(400).json({ error: "Message body is required" });

      const now = new Date();
      const insert = {
        applicantId: new ObjectId(String(applicantId)),
        jobId: applicant.jobId,
        senderRole: "employer",
        sender: employer.email,
        body,
        createdAt: now,
      };

      const result = await db
        .collection("applicant_messages")
        .insertOne(insert);

      await db.collection("notification_events").insertOne({
        type: "applicant_message_received",
        audience: "applicant",
        applicantId: String(applicantId),
        jobId: String(applicant.jobId),
        applicantEmail: applicant.email || "",
        employerEmail: employer.email,
        title: `New message about ${job.title || "your application"}`,
        body,
        read: false,
        createdAt: now,
      });

      return res
        .status(201)
        .json({ success: true, messageId: String(result.insertedId) });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (e: any) {
    if (e?.message === "401")
      return res.status(401).json({ error: "Not authenticated" });
    if (e?.message === "403")
      return res.status(403).json({ error: "Access denied" });
    console.error("[applicants/messages]", e);
    return res.status(500).json({ error: "Internal server error" });
  }
}
