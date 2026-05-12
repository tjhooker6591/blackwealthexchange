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
    return res.status(405).json({ error: "Method not allowed" });
  }

  const db = (await clientPromise).db(getMongoDbName());
  const tickets = await db
    .collection("support_tickets")
    .find({})
    .sort({ createdAt: -1 })
    .limit(1000)
    .toArray();

  const now = Date.now();
  const unresolved = tickets.filter(
    (t: any) => !["resolved", "closed"].includes(t.status),
  );
  const open24 = unresolved.filter(
    (t: any) => now - new Date(t.createdAt || 0).getTime() > 24 * 3600 * 1000,
  ).length;
  const open48 = unresolved.filter(
    (t: any) => now - new Date(t.createdAt || 0).getTime() > 48 * 3600 * 1000,
  ).length;
  const urgent = unresolved.filter((t: any) => t.priority === "urgent").length;
  const financial = unresolved.filter(
    (t: any) =>
      t.priority === "financial" || t.category === "Billing / Payment",
  ).length;
  const security = unresolved.filter(
    (t: any) => t.priority === "security" || t.category === "Trust & Safety",
  ).length;

  const by = (key: string) =>
    tickets.reduce((a: any, t: any) => {
      const k = t[key] || "unknown";
      a[k] = (a[k] || 0) + 1;
      return a;
    }, {});

  const avgResponseHours = 0; // placeholder until firstResponseAt is recorded
  const resolved = tickets.filter((t: any) => t.resolvedAt && t.createdAt);
  const avgResolutionHours = resolved.length
    ? resolved.reduce(
        (s: number, t: any) =>
          s +
          (new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime()) /
            3600000,
        0,
      ) / resolved.length
    : 0;

  const recentEscalations = tickets
    .filter((t: any) => t.escalationLevel && t.escalationLevel !== "none")
    .slice(0, 20)
    .map((t: any) => ({
      ticketId: t.ticketId,
      escalationLevel: t.escalationLevel,
      status: t.status,
      category: t.category,
      updatedAt: t.updatedAt,
    }));
  const repeatIssuePatterns = Object.entries(by("subject"))
    .filter(([, v]: any) => v >= 2)
    .slice(0, 10)
    .map(([subject, count]) => ({ subject, count }));

  return res.status(200).json({
    ok: true,
    metrics: {
      totalOpenTickets: unresolved.length,
      urgentTickets: urgent,
      financialBillingTickets: financial,
      securityTrustTickets: security,
      unresolvedOver24Hours: open24,
      unresolvedOver48Hours: open48,
      averageResponseTimeHours: avgResponseHours,
      averageResolutionTimeHours: Number(avgResolutionHours.toFixed(2)),
    },
    ticketsByCategory: by("category"),
    ticketsByStatus: by("status"),
    ticketsByPriority: by("priority"),
    recentEscalations,
    repeatIssuePatterns,
  });
}
