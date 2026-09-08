import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { ADMIN_ERROR_CODES, adminFail } from "@/lib/adminApiContract";
import {
  resolveBusinessEconomicActivity360,
  resolvePersonEconomicActivity360,
  type EconomicActivity360Summary,
} from "@/lib/economicActivity360";

type ResponseBody =
  | {
      ok: true;
      anchor: "businesses._id" | "users._id";
      result: EconomicActivity360Summary;
    }
  | { ok: false; code: string; message: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseBody>,
) {
  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return adminFail(
      res,
      405,
      ADMIN_ERROR_CODES.METHOD_NOT_ALLOWED,
      "Method Not Allowed",
    );
  }

  const businessId = String(req.query.businessId || "").trim();
  const userId = String(req.query.userId || "").trim();

  if (!businessId && !userId) {
    return adminFail(
      res,
      400,
      "MISSING_ANCHOR",
      "A businessId or userId identifier is required.",
    );
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const tracker = { queryCount: 0 };

    if (businessId) {
      const result = await resolveBusinessEconomicActivity360(db, tracker, {
        businessId,
      });
      return res
        .status(200)
        .json({ ok: true, anchor: "businesses._id", result });
    }

    const result = await resolvePersonEconomicActivity360(db, tracker, {
      userId,
    });
    return res.status(200).json({ ok: true, anchor: "users._id", result });
  } catch (error: any) {
    return adminFail(
      res,
      500,
      ADMIN_ERROR_CODES.INTERNAL_ERROR,
      String(error?.message || "Failed to resolve economic activity."),
    );
  }
}
