import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }
  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const members = db.collection("challenge_members");

    const [count, ownerInterest, cityAgg] = await Promise.all([
      members.countDocuments({}),
      members.countDocuments({ ownsBusiness: true }),
      members.aggregate([{ $match: { city: { $ne: "" } } }, { $group: { _id: "$city", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 5 }]).toArray(),
    ]);

    const citiesRepresented = await members.distinct("city", { city: { $ne: "" } });

    return res.status(200).json({
      ok: true,
      membersJoined: count,
      citiesRepresented: citiesRepresented.length,
      businessOwnerInterestCount: ownerInterest,
      topCities: cityAgg.map((c: any) => ({ city: c._id, count: c.count })),
    });
  } catch (e) {
    console.error("[/api/challenge/stats]", e);
    return res.status(500).json({ ok: false, error: "Unable to load challenge stats." });
  }
}
