// src/pages/api/admin/feature-product.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { requireAdminFromRequest } from "@/lib/adminAuth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Phase 8 -- P8-AUTH-002 follow-up. Previously the admin check on this
  // route was only enforced when NODE_ENV === "production" -- meaning in
  // any non-production environment (development, or a reachable
  // staging/preview deployment), ANY authenticated user, admin or not,
  // could toggle a product's featured status. Also reimplemented its own
  // JWT verification instead of using the shared, DB-re-verified
  // requireAdminFromRequest. Both are fixed by switching to the shared
  // helper, which enforces admin status in every environment.
  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  try {
    const { productId, isFeatured } =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};

    if (
      !productId ||
      !ObjectId.isValid(productId) ||
      typeof isFeatured !== "boolean"
    ) {
      return res
        .status(400)
        .json({ error: "Valid productId and isFeatured are required." });
    }

    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    const result = await db.collection("products").updateOne(
      { _id: new ObjectId(productId) },
      {
        $set: {
          isFeatured,
          updatedAt: new Date(),
          featuredUpdatedBy: admin.email || admin.userId || "admin",
        },
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Product not found." });
    }

    return res.status(200).json({
      success: true,
      productId,
      isFeatured,
    });
  } catch (err) {
    console.error("[/api/admin/feature-product] Error:", err);
    return res.status(500).json({ error: "Failed to update featured status." });
  }
}
