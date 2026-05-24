import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { safeCount, startOfMonth } from "@/lib/adminMetrics";

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
  const month = startOfMonth();
  const users = await safeCount(db, "users", { createdAt: { $gte: month } });
  const businesses = await safeCount(db, "businesses", {
    createdAt: { $gte: month },
  });
  const sellers = await safeCount(db, "sellers", {
    createdAt: { $gte: month },
  });
  const employers = await safeCount(db, "employers", {
    createdAt: { $gte: month },
  });
  const sponsorLeads = await safeCount(db, "advertising_requests", {
    createdAt: { $gte: month },
  });
  return res
    .status(200)
    .json({ ok: true, users, businesses, sellers, employers, sponsorLeads });
}
