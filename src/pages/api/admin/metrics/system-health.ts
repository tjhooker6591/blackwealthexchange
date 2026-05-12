import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({
      ok: false,
      code: "METHOD_NOT_ALLOWED",
      message: "Method not allowed",
    });
  }
  const db = (await clientPromise).db(getMongoDbName());
  const logs = await db
    .collection("system_health_logs")
    .find({})
    .sort({ createdAt: -1 })
    .limit(500)
    .toArray()
    .catch(() => []);
  const failingRoutes = [
    ...new Set(
      logs
        .filter((x: any) => x.status === "fail" || x.httpStatus >= 500)
        .map((x: any) => x.route)
        .filter(Boolean),
    ),
  ];
  const failures = logs.filter(
    (x: any) => x.status === "fail" || x.httpStatus >= 500,
  );
  return res.status(200).json({
    ok: true,
    errorCount: failures.length,
    failingRoutes,
    lastFailureTime: failures[0]?.createdAt || null,
    uptimeIndicator: failures.length === 0 ? "healthy" : "degraded",
  });
}
