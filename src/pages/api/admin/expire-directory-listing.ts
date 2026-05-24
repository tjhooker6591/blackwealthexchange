// src/pages/api/admin/expire-directory-listing.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { requireAdminFromRequest } from "@/lib/adminAuth";
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

  try {
    const { listingId } =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};

    if (!listingId || !ObjectId.isValid(listingId)) {
      return res.status(400).json({ error: "Valid listingId is required" });
    }

    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    const now = new Date();

    const result = await db.collection("directory_listings").findOneAndUpdate(
      { _id: new ObjectId(listingId) },
      {
        $set: {
          // compatibility + new truth model
          status: "expired",
          listingStatus: "expired",

          // payment should remain whatever it already was; if not set, keep paid if previously paid
          updatedAt: now,
          expiredAt: now,
          expiredBy: admin.email || admin.userId || "admin",

          // slot/featured cleanup
          featuredSlot: null,
          featuredStartDate: null,
          featuredEndDate: null,

          // no longer active, no longer needs queue placement
          needsAttention: false,
        },
        $unset: {
          queuePosition: "",
        },
      },
      { returnDocument: "after" },
    );

    if (!result) {
      return res.status(404).json({ error: "Directory listing not found" });
    }

    return res.status(200).json({
      success: true,
      listingId,
      status: "expired",
      listingStatus: "expired",
    });
  } catch (err) {
    console.error("[expire-directory-listing] Error:", err);
    return res.status(500).json({ error: "Expire failed" });
  }
}
