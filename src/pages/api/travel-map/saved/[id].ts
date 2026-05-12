import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { requireWealthUser } from "@/lib/wealth-builder/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const auth = await requireWealthUser(req, res);
  if (!auth) return;

  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
    return res
      .status(405)
      .json({ ok: false, message: `Method ${req.method} not allowed.` });
  }

  const { id } = req.query;
  if (typeof id !== "string" || !id.trim()) {
    return res
      .status(400)
      .json({ ok: false, message: "Saved place id is required." });
  }

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return res
      .status(400)
      .json({ ok: false, message: "Invalid saved place id." });
  }

  try {
    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB?.trim();
    const db = dbName ? client.db(dbName) : client.db();

    const result = await db.collection("travel_map_saved_places").deleteOne({
      _id: objectId,
      userId: auth.userId,
      accountType: "user",
    });

    if (!result.deletedCount) {
      return res
        .status(404)
        .json({ ok: false, message: "Saved place not found." });
    }

    return res.status(200).json({ ok: true, id });
  } catch (error) {
    console.error("travel-map/saved delete error", error);
    return res
      .status(500)
      .json({ ok: false, message: "Failed to delete saved place." });
  }
}
