import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { safeCount } from "@/lib/adminMetrics";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({
      ok: false,
      code: "METHOD_NOT_ALLOWED",
      message: "Method not allowed",
    });
  }
  const db = (await clientPromise).db(getMongoDbName());
  const pendingBusinesses = await safeCount(db, "businesses", {
    status: { $in: ["pending", "pending_review"] },
  });
  const pendingProducts = await safeCount(db, "products", {
    status: { $in: ["pending", "pending_review"] },
  });
  const pendingJobs = await safeCount(db, "jobs", {
    status: { $in: ["pending", "pending_review"] },
  });
  const rejectedBusinesses = await safeCount(db, "businesses", {
    status: { $in: ["rejected", "denied"] },
  });
  const rejectedProducts = await safeCount(db, "products", {
    status: { $in: ["rejected", "denied"] },
  });
  const trustSafetyTickets = await safeCount(db, "support_tickets", {
    category: "Trust & Safety",
  });
  const disputes = await safeCount(db, "disputes", {});
  return res.status(200).json({
    ok: true,
    pendingBusinesses,
    pendingProducts,
    pendingJobs,
    rejectedBusinesses,
    rejectedProducts,
    trustSafetyTickets,
    disputes,
  });
}
