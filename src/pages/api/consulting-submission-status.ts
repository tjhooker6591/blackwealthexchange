import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function stageLabel(stage: string) {
  const map: Record<string, string> = {
    new: "New",
    triaged: "Triaged",
    reviewed: "Reviewed",
    approved: "Approved",
    discovery_scheduled: "Discovery Scheduled",
    proposal_sent: "Proposal Sent",
    in_delivery: "In Delivery",
    closed_won: "Closed Won",
    closed_lost: "Closed Lost",
  };
  return map[stage] || stage;
}

function inferActionOwner(stage: string, status: string) {
  if (["closed_won", "closed_lost"].includes(stage)) return "complete";
  if (status === "flagged" || status === "spam") return "internal_review";
  if (stage === "discovery_scheduled") return "submitter";
  return "internal_team";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const email = String(req.query?.email || "")
      .trim()
      .toLowerCase();

    if (!email || !isValidEmail(email)) {
      return res
        .status(400)
        .json({ ok: false, error: "Valid email is required." });
    }

    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    await ensureApiRateLimitIndexes(db);
    const ip = getClientIp(req);
    const limiter = await hitApiRateLimit(
      db,
      `consulting:status:ip:${ip}`,
      40,
      10,
    );

    if (limiter.blocked) {
      res.setHeader("Retry-After", String(limiter.retryAfterSeconds));
      return res.status(429).json({
        ok: false,
        error: "Too many requests. Please try again later.",
      });
    }

    const [interestRows, intakeRows] = await Promise.all([
      db
        .collection("consulting_interest")
        .find({ email })
        .sort({ createdAt: -1 })
        .limit(10)
        .project({
          createdAt: 1,
          updatedAt: 1,
          source: 1,
          status: 1,
          lifecycleStage: 1,
          nextAction: 1,
          followUpAt: 1,
          service: 1,
          interestType: 1,
          moderationStatus: 1,
        })
        .toArray(),
      db
        .collection("consulting_intake")
        .find({ email })
        .sort({ createdAt: -1 })
        .limit(10)
        .project({
          createdAt: 1,
          updatedAt: 1,
          source: 1,
          status: 1,
          lifecycleStage: 1,
          nextAction: 1,
          followUpAt: 1,
          type: 1,
          moderationStatus: 1,
        })
        .toArray(),
    ]);

    const submissions = [
      ...interestRows.map((x: any) => ({
        id: String(x._id),
        lane: "consulting_interest",
        submissionType: x.interestType || x.service || "interest",
        status: String(x.status || "pending"),
        lifecycleStage: String(x.lifecycleStage || "new"),
        nextAction: String(x.nextAction || "Initial triage pending"),
        moderationStatus: String(x.moderationStatus || "clean"),
        stageLabel: stageLabel(String(x.lifecycleStage || "new")),
        actionOwner: inferActionOwner(
          String(x.lifecycleStage || "new"),
          String(x.status || "pending"),
        ),
        source: String(x.source || "website"),
        createdAt: x.createdAt ? new Date(x.createdAt).toISOString() : null,
        updatedAt: x.updatedAt ? new Date(x.updatedAt).toISOString() : null,
        followUpAt: x.followUpAt ? new Date(x.followUpAt).toISOString() : null,
      })),
      ...intakeRows.map((x: any) => ({
        id: String(x._id),
        lane: "consulting_intake",
        submissionType: x.type || "intake",
        status: String(x.status || "pending"),
        lifecycleStage: String(x.lifecycleStage || "new"),
        nextAction: String(x.nextAction || "Initial triage pending"),
        moderationStatus: String(x.moderationStatus || "clean"),
        stageLabel: stageLabel(String(x.lifecycleStage || "new")),
        actionOwner: inferActionOwner(
          String(x.lifecycleStage || "new"),
          String(x.status || "pending"),
        ),
        source: String(x.source || "recruiting_consulting_page"),
        createdAt: x.createdAt ? new Date(x.createdAt).toISOString() : null,
        updatedAt: x.updatedAt ? new Date(x.updatedAt).toISOString() : null,
        followUpAt: x.followUpAt ? new Date(x.followUpAt).toISOString() : null,
      })),
    ]
      .sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      })
      .slice(0, 10);

    return res.status(200).json({ ok: true, submissions });
  } catch (error) {
    console.error("[api/consulting-submission-status]", error);
    return res.status(500).json({ ok: false, error: "Failed to load status" });
  }
}
