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
  const rows = await db
    .collection("support_tickets")
    .aggregate([
      {
        $facet: {
          byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
          byPriority: [{ $group: { _id: "$priority", count: { $sum: 1 } } }],
          byCategory: [{ $group: { _id: "$category", count: { $sum: 1 } } }],
        },
      },
    ])
    .toArray();

  const now = Date.now();
  const all = await db
    .collection("support_tickets")
    .find({})
    .project({
      createdAt: 1,
      status: 1,
      priority: 1,
      category: 1,
      firstResponseAt: 1,
    })
    .limit(5000)
    .toArray();
  const nowMs = Date.now();
  const olderThan3Days = all.filter(
    (t: any) =>
      now - new Date(t.createdAt || 0).getTime() > 3 * 24 * 3600 * 1000,
  ).length;
  const escalated = all.filter((t: any) =>
    String(t.status || "")
      .toLowerCase()
      .includes("escalat"),
  ).length;
  const escalationRatePercent = all.length
    ? Number(((escalated / all.length) * 100).toFixed(2))
    : 0;
  const withAging = all.map((t: any) => ({
    ...t,
    ageHours: (nowMs - new Date(t.createdAt || 0).getTime()) / 3600000,
  }));
  const atRisk = withAging.filter(
    (t: any) =>
      t.ageHours > 24 &&
      !["resolved", "closed"].includes(String(t.status || "").toLowerCase()),
  ).length;
  const overdue = withAging.filter(
    (t: any) =>
      t.ageHours > 72 &&
      !["resolved", "closed"].includes(String(t.status || "").toLowerCase()),
  ).length;
  const slaPerformancePercent = all.length
    ? Number((((all.length - overdue) / all.length) * 100).toFixed(2))
    : 100;
  const criticalIssueDetection = all.filter(
    (t: any) =>
      ["security", "urgent"].includes(String(t.priority || "").toLowerCase()) ||
      String(t.category || "")
        .toLowerCase()
        .includes("trust"),
  ).length;
  const responded = all.filter((t: any) => t.firstResponseAt && t.createdAt);
  const avgResponseHours = responded.length
    ? Number(
        (
          responded.reduce(
            (s: number, t: any) =>
              s +
              (new Date(t.firstResponseAt).getTime() -
                new Date(t.createdAt).getTime()) /
                3600000,
            0,
          ) / responded.length
        ).toFixed(2),
      )
    : 0;

  return res.status(200).json({
    ok: true,
    ...(rows[0] || { byStatus: [], byPriority: [], byCategory: [] }),
    intelligence: {
      averageResponseTimeHours: avgResponseHours,
      ticketsOlderThan3Days: olderThan3Days,
      escalationRatePercent,
      criticalIssueDetection,
      ticketAging: { atRisk, overdue },
      slaPerformancePercent,
    },
  });
}
