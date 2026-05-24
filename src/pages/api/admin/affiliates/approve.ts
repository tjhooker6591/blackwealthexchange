// src/pages/api/admin/affiliates/approve.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { getMongoDbName } from "@/lib/env";
import { ADMIN_ERROR_CODES, adminFail } from "@/lib/adminApiContract";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return adminFail(
      res,
      405,
      ADMIN_ERROR_CODES.METHOD_NOT_ALLOWED,
      "Method Not Allowed",
    );
  }

  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  const { affiliateId } = req.body;

  if (!affiliateId) {
    console.warn("Approval attempt without affiliateId");
    return adminFail(
      res,
      400,
      ADMIN_ERROR_CODES.MISSING_AFFILIATE_ID,
      "Missing affiliateId",
    );
  }

  if (!ObjectId.isValid(affiliateId)) {
    return adminFail(
      res,
      400,
      ADMIN_ERROR_CODES.INVALID_AFFILIATE_ID,
      "Invalid affiliateId",
    );
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    const affiliate = await db
      .collection("affiliates")
      .findOne({ _id: new ObjectId(affiliateId) });

    if (!affiliate) {
      console.warn(`Affiliate with ID ${affiliateId} not found`);
      return adminFail(
        res,
        404,
        ADMIN_ERROR_CODES.AFFILIATE_NOT_FOUND,
        "Affiliate not found",
      );
    }

    if (affiliate.status === "active") {
      return res
        .status(200)
        .json({ ok: true, message: "Affiliate is already active" });
    }

    await db
      .collection("affiliates")
      .updateOne(
        { _id: new ObjectId(affiliateId) },
        { $set: { status: "active", approvedAt: new Date() } },
      );

    console.log(`✅ Affiliate ${affiliate.email} approved successfully.`);

    return res.status(200).json({ ok: true, message: "Affiliate approved." });
  } catch (err) {
    console.error("Affiliate approval error:", err);
    return adminFail(
      res,
      500,
      ADMIN_ERROR_CODES.INTERNAL_ERROR,
      "Internal Server Error",
    );
  }
}
