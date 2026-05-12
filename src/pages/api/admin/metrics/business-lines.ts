import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { safeCount, sumAmount } from "@/lib/adminMetrics";

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
  const core = {
    users: await safeCount(db, "users"),
    businesses: await safeCount(db, "businesses"),
    products: await safeCount(db, "products"),
    jobs: await safeCount(db, "jobs"),
  };
  const growthRevenue = {
    advertising: await sumAmount(db, "advertising_requests", {}, [
      "amount",
      "price",
    ]),
    affiliate: await sumAmount(db, "affiliate_revenue", {}, [
      "amount",
      "commission",
    ]),
    consulting: await sumAmount(db, "consulting_intake", {}, [
      "revenueAmount",
      "amount",
    ]),
    manual: await sumAmount(db, "manual_offline_revenue", {}, ["amount"]),
  };
  const creatorMedia = {
    musicCreators: await safeCount(db, "music_creator_onboarding"),
    events: await safeCount(db, "events"),
  };
  const futureBets = {
    wealthBuilderUsers: await safeCount(db, "users", {
      "wealthBuilder.enabled": true,
    }),
    travelMapSaves: await safeCount(db, "travel_map_saved"),
    blackCardRewards: await safeCount(db, "black_card_rewards"),
  };
  return res
    .status(200)
    .json({ ok: true, core, growthRevenue, creatorMedia, futureBets });
}
