import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { ensureTravelMapIndexes } from "@/lib/travelMapIndexes";

function distToSegmentKm(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  const A = px - x1,
    B = py - y1,
    C = x2 - x1,
    D = y2 - y1;
  const dot = A * C + B * D;
  const len = C * C + D * D;
  const t = len ? Math.max(0, Math.min(1, dot / len)) : 0;
  const x = x1 + t * C,
    y = y1 + t * D;
  const dx = px - x,
    dy = py - y;
  return Math.sqrt(dx * dx + dy * dy) * 111;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }
  const fromLat = Number(req.query.fromLat),
    fromLng = Number(req.query.fromLng),
    toLat = Number(req.query.toLat),
    toLng = Number(req.query.toLng);
  const corridorKm = Math.max(
    1,
    Math.min(50, Number(req.query.corridorKm || 15)),
  );
  const limit = Math.max(1, Math.min(200, Number(req.query.limit || 100)));
  if (
    !Number.isFinite(fromLat) ||
    !Number.isFinite(fromLng) ||
    !Number.isFinite(toLat) ||
    !Number.isFinite(toLng)
  )
    return res
      .status(400)
      .json({ ok: false, error: "fromLat,fromLng,toLat,toLng required" });

  const client = await clientPromise;
  const db = client.db(getMongoDbName());
  await ensureTravelMapIndexes(db);
  const minLat = Math.min(fromLat, toLat) - 0.6,
    maxLat = Math.max(fromLat, toLat) + 0.6,
    minLng = Math.min(fromLng, toLng) - 0.6,
    maxLng = Math.max(fromLng, toLng) + 0.6;

  const docs = await db
    .collection("businesses")
    .find(
      {
        $or: [
          { status: "approved" },
          { status: "active" },
          { status: { $exists: false } },
        ],
        latitude: { $gte: minLat, $lte: maxLat },
        longitude: { $gte: minLng, $lte: maxLng },
      },
      {
        projection: {
          business_name: 1,
          slug: 1,
          category: 1,
          city: 1,
          state: 1,
          address: 1,
          latitude: 1,
          longitude: 1,
          verified: 1,
          sponsored: 1,
          updatedAt: 1,
        },
      },
    )
    .limit(limit * 3)
    .toArray();

  const results = docs
    .map((d: any) => {
      const lat = Number(d.latitude),
        lng = Number(d.longitude);
      const distanceToRouteKm = distToSegmentKm(
        lat,
        lng,
        fromLat,
        fromLng,
        toLat,
        toLng,
      );
      return {
        id: String(d._id),
        business_name: d.business_name || "(unnamed)",
        slug: d.slug || null,
        category: d.category || null,
        city: d.city || null,
        state: d.state || null,
        latitude: lat,
        longitude: lng,
        verified: !!d.verified,
        sponsored: !!d.sponsored,
        distanceToRouteKm: Number(distanceToRouteKm.toFixed(2)),
      };
    })
    .filter(
      (r: any) =>
        Number.isFinite(r.latitude) &&
        Number.isFinite(r.longitude) &&
        r.distanceToRouteKm <= corridorKm,
    )
    .sort(
      (a: any, b: any) =>
        a.distanceToRouteKm - b.distanceToRouteKm ||
        Number(b.verified) - Number(a.verified) ||
        Number(b.sponsored) - Number(a.sponsored),
    )
    .slice(0, limit);

  await db.collection("flow_events").insertOne({
    eventType: "travel_map_route_corridor_search",
    pageRoute: "/api/travel-map/route-corridor",
    source: "travel_map",
    fromLat,
    fromLng,
    toLat,
    toLng,
    corridorKm,
    resultCount: results.length,
    createdAt: new Date(),
  });
  return res.status(200).json({
    ok: true,
    results,
    meta: { corridorKm, freeInclusion: true, source: "businesses" },
  });
}
