import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { safeCount } from "@/lib/adminMetrics";

const err = (res: NextApiResponse, c: number, code: string, message: string) =>
  res.status(c).json({ ok: false, code, message });
const since = (d: number) => new Date(Date.now() - d * 24 * 3600 * 1000);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return err(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed");
  }
  const db = (await clientPromise).db(getMongoDbName());
  const week = since(7);
  const out = {
    generalUser: {
      activeThisWeek: await safeCount(db, "users", {
        updatedAt: { $gte: week },
      }),
      newThisWeek: await safeCount(db, "users", { createdAt: { $gte: week } }),
    },
    seller: {
      ordersRequiringAction: await safeCount(db, "orders", {
        status: { $in: ["pending", "processing"] },
      }),
      payoutIssues: await safeCount(db, "support_tickets", {
        category: "Seller/Payout",
        status: { $nin: ["Resolved", "Closed"] },
      }),
    },
    businessOwner: {
      listingsNeedingAction: await safeCount(db, "businesses", {
        status: { $in: ["pending", "pending_review"] },
      }),
      adOpportunities: { value: 0, sourceStatus: "needs_mapping" },
    },
    employer: {
      applicantsRequiringReview: await safeCount(db, "applicants", {
        status: { $in: ["new", "submitted"] },
      }),
      jobsActive: await safeCount(db, "jobs", { status: "approved" }),
    },
    advertiser: {
      campaignsRequiringAction: await safeCount(
        db,
        "featured_sponsor_schedule",
        { queueStatus: { $in: ["needs_review", "pending"] } },
      ),
      supportTickets: await safeCount(db, "support_tickets", {
        category: "Advertising/Sponsorship",
        status: { $nin: ["Resolved", "Closed"] },
      }),
    },
    memberBlackCard: {
      activeMembers: { value: 0, sourceStatus: "needs_mapping" },
      benefitsAtRisk: { value: 0, sourceStatus: "needs_mapping" },
    },
    studentLearner: {
      activeLearners: await safeCount(db, "course_progress", {
        updatedAt: { $gte: week },
      }),
      nextLessonReady: { value: 0, sourceStatus: "needs_mapping" },
    },
    creatorMusic: {
      onboardingInProgress: await safeCount(db, "music_creator_onboarding", {
        status: { $in: ["started", "pending"] },
      }),
      paidPlans: { value: 0, sourceStatus: "needs_mapping" },
    },
    adminFounder: {
      ticketsRequiringAction: await safeCount(db, "support_tickets", {
        status: { $nin: ["Resolved", "Closed"] },
      }),
      decisionsNeeded: { value: 0, sourceStatus: "needs_mapping" },
    },
  };
  return res
    .status(200)
    .json({ ok: true, retention: out, generatedAt: new Date().toISOString() });
}
