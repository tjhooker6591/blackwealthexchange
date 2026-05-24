import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  const id = String(req.query.id || "").trim();
  if (!id || !ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid listing id" });
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    const listing = await db
      .collection("directory_listings")
      .findOne({ _id: new ObjectId(id) });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    return res.status(200).json({
      ok: true,
      listing: {
        ...listing,
        _id: String(listing._id),
      },
    });
  } catch (error) {
    console.error("[/api/admin/get-directory-listing] error", error);
    return res.status(500).json({ error: "Failed to fetch listing" });
  }
}
