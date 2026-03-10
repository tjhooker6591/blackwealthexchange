import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";

type Ok = { success: true; message: string };
type Err = { success: false; error: string };

function asText(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function validEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Ok | Err>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res
      .status(405)
      .json({ success: false, error: "Method Not Allowed" });
  }

  try {
    const type = asText(req.body?.type).toLowerCase();
    const name = asText(req.body?.name);
    const email = asText(req.body?.email).toLowerCase();
    const company = asText(req.body?.company);
    const phone = asText(req.body?.phone);
    const details = asText(req.body?.details);

    if (!["employer", "candidate"].includes(type)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid intake type." });
    }

    if (!name || !email || !details) {
      return res.status(400).json({
        success: false,
        error: "Name, email, and details are required.",
      });
    }

    if (!validEmail(email)) {
      return res
        .status(400)
        .json({ success: false, error: "Please enter a valid email." });
    }

    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    await ensureApiRateLimitIndexes(db);
    const ip = getClientIp(req);
    const ipLimit = await hitApiRateLimit(db, `consulting:intake:ip:${ip}`, 30, 10);
    const emailLimit = await hitApiRateLimit(
      db,
      `consulting:intake:email:${email}`,
      5,
      60,
    );

    if (ipLimit.blocked || emailLimit.blocked) {
      res.setHeader(
        "Retry-After",
        String(Math.max(ipLimit.retryAfterSeconds, emailLimit.retryAfterSeconds)),
      );
      return res.status(429).json({
        success: false,
        error: "Too many submissions. Please try again later.",
      });
    }

    await db.collection("consulting_intake").insertOne({
      type,
      name,
      email,
      company: company || null,
      phone: phone || null,
      details,
      status: "new",
      createdAt: new Date(),
      source: "homepage_recruiting_section",
    });

    return res.status(200).json({
      success: true,
      message:
        type === "employer"
          ? "Employer request received. We will contact you shortly."
          : "Talent profile received. We will review and follow up.",
    });
  } catch (err) {
    console.error("consulting-intake error", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to submit intake." });
  }
}
