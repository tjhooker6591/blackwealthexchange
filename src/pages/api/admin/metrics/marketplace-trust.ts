import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { safeCount } from "@/lib/adminMetrics";
const err = (res: NextApiResponse, c: number, code: string, message: string) =>
  res.status(c).json({ ok: false, code, message });
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return err(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed");
  }
  const db = (await clientPromise).db(getMongoDbName());
  const total = await safeCount(db, "orders", {});
  const pending = await safeCount(db, "orders", {
    status: { $in: ["pending", "processing"] },
  });
  const completed = await safeCount(db, "orders", {
    status: { $in: ["fulfilled", "completed"] },
  });
  const cancelled = await safeCount(db, "orders", {
    status: { $in: ["cancelled", "refunded"] },
  });
  const orderTickets = await safeCount(db, "support_tickets", {
    category: "Marketplace Order",
    status: { $nin: ["Resolved", "Closed"] },
  });
  const payoutIssues = await safeCount(db, "support_tickets", {
    category: "Seller/Payout",
    status: { $nin: ["Resolved", "Closed"] },
  });
  const disputes = await safeCount(db, "support_tickets", {
    category: "Billing/Refund",
    status: { $nin: ["Resolved", "Closed"] },
  });
  return res.status(200).json({
    ok: true,
    metrics: {
      totalOrders: total,
      pendingOrders: pending,
      completedOrders: completed,
      cancelledOrRefunded: cancelled,
      openOrderSupportTickets: orderTickets,
      sellerPayoutIssues: payoutIssues,
      disputeRefundTickets: disputes,
      avgOrderTicketResolutionHours: {
        value: 0,
        sourceStatus: "needs_mapping",
      },
      productsPendingApproval: await safeCount(db, "products", {
        status: "pending",
      }),
      rejectedProducts: await safeCount(db, "products", {
        status: "rejected",
      }),
      sellerVerification: { value: 0, sourceStatus: "needs_mapping" },
    },
  });
}
