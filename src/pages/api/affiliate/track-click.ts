import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getMongoDbName } from "@/lib/env";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const affiliateId = String(req.body?.affiliateId || "").trim();
    if (!affiliateId || !ObjectId.isValid(affiliateId)) {
      return res.status(400).json({ message: "Valid affiliate ID required" });
    }

    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    const affiliate = await db
      .collection("affiliates")
      .findOne(
        { _id: new ObjectId(affiliateId) },
        { projection: { _id: 1, status: 1 } },
      );

    if (!affiliate) {
      return res.status(404).json({ message: "Affiliate not found" });
    }

    await db.collection("affiliateClicks").insertOne({
      affiliateId,
      clickedAt: new Date(),
      userAgent: req.headers["user-agent"] || null,
      ip:
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        req.socket.remoteAddress ||
        null,
    });

    await db
      .collection("affiliates")
      .updateOne({ _id: new ObjectId(affiliateId) }, { $inc: { clicks: 1 } });

    return res.status(200).json({ message: "Click tracked." });
  } catch (err) {
    console.error("Track Click Error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
