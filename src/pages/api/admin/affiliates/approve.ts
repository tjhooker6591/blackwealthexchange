// src/pages/api/admin/affiliates/approve.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getAdminDecodedFromRequest, isAdminDecoded } from "@/lib/adminAuth";
import { getMongoDbName } from "@/lib/env";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const fail = (status: number, code: string, message: string) =>
    res.status(status).json({ ok: false, code, message });

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return fail(405, "METHOD_NOT_ALLOWED", "Method Not Allowed");
  }

  const admin = getAdminDecodedFromRequest(req);
  if (!admin) {
    return fail(401, "UNAUTHORIZED", "Unauthorized");
  }
  if (!isAdminDecoded(admin)) {
    return fail(403, "FORBIDDEN", "Forbidden");
  }

  const { affiliateId } = req.body;

  if (!affiliateId) {
    console.warn("Approval attempt without affiliateId");
    return fail(400, "MISSING_AFFILIATE_ID", "Missing affiliateId");
  }

  if (!ObjectId.isValid(affiliateId)) {
    return fail(400, "INVALID_AFFILIATE_ID", "Invalid affiliateId");
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    const affiliate = await db
      .collection("affiliates")
      .findOne({ _id: new ObjectId(affiliateId) });

    if (!affiliate) {
      console.warn(`Affiliate with ID ${affiliateId} not found`);
      return fail(404, "AFFILIATE_NOT_FOUND", "Affiliate not found");
    }

    if (affiliate.status === "active") {
      return res
        .status(200)
        .json({ ok: true, message: "Affiliate is already active" });
    }

    await db.collection("affiliates").updateOne(
      { _id: new ObjectId(affiliateId) },
      { $set: { status: "active", approvedAt: new Date() } },
    );

    console.log(`✅ Affiliate ${affiliate.email} approved successfully.`);

    return res.status(200).json({ ok: true, message: "Affiliate approved." });
  } catch (err) {
    console.error("Affiliate approval error:", err);
    return fail(500, "INTERNAL_ERROR", "Internal Server Error");
  }
}
