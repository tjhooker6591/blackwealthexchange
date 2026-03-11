import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};
    const { userId, subject, description } = body;

    // Basic validation
    if (!userId || !subject || !description) {
      return res
        .status(400)
        .json({ message: "User ID, Subject, and Description are required." });
    }

    if (description.trim().length < 10) {
      return res.status(400).json({
        message: "Description is too short. Please provide more details.",
      });
    }

    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    await ensureApiRateLimitIndexes(db);
    const ip = getClientIp(req);
    const userKey = typeof userId === "string" ? userId : "anon";
    const ipLimit = await hitApiRateLimit(
      db,
      `support:create:ip:${ip}`,
      20,
      30,
    );
    const userLimit = await hitApiRateLimit(
      db,
      `support:create:user:${userKey}`,
      8,
      30,
    );
    if (ipLimit.blocked || userLimit.blocked) {
      res.setHeader(
        "Retry-After",
        String(
          Math.max(ipLimit.retryAfterSeconds, userLimit.retryAfterSeconds),
        ),
      );
      return res.status(429).json({ message: "Too many support submissions" });
    }

    // Create support ticket
    const ticket = {
      userId,
      subject,
      description,
      status: "open", // open, in_progress, closed
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("supportTickets").insertOne(ticket);

    return res.status(200).json({
      message: "Support ticket submitted successfully.",
      ticketId: result.insertedId,
    });
  } catch (error) {
    console.error("Support Ticket Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
