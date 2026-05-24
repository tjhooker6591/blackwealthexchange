import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { ensureUnifiedVerifierIndexes } from "@/lib/unifiedVerifierIndexes";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }
  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  const email = String(req.query.email || "")
    .trim()
    .toLowerCase();
  const userId = String(req.query.userId || "").trim();
  const stripeSessionId = String(req.query.stripeSessionId || "").trim();
  const paymentIntentId = String(req.query.paymentIntentId || "").trim();
  const itemId = String(req.query.itemId || "").trim();

  if (!email && !userId && !stripeSessionId && !paymentIntentId && !itemId) {
    return res
      .status(400)
      .json({ ok: false, error: "Provide at least one filter" });
  }

  const client = await clientPromise;
  const db = client.db(getMongoDbName());
  await ensureUnifiedVerifierIndexes(db);

  const and: any[] = [];
  if (email) and.push({ email });
  if (userId) and.push({ userId });
  if (stripeSessionId) and.push({ stripeSessionId });
  if (paymentIntentId) and.push({ paymentIntentId });
  if (itemId) and.push({ itemId });

  const q: any = and.length ? { $and: and } : {};
  const payments = await db
    .collection("payments")
    .find(q)
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  const items = await Promise.all(
    payments.map(async (p: any) => {
      const type = String(p.type || p?.metadata?.type || "unknown");
      let entitlement: any = null;
      let failurePoint: string | null = null;

      if (type === "course") {
        const courseId = String(p?.metadata?.courseId || p.itemId || "");
        const enrollment = await db
          .collection("enrollments")
          .findOne({ userId: p.userId, courseId });
        entitlement = {
          kind: "course",
          courseId,
          enrollmentFound: Boolean(enrollment),
          enrollmentId: enrollment?._id ? String(enrollment._id) : null,
        };
        if (String(p.status).toLowerCase() === "paid" && !enrollment)
          failurePoint = "paid_without_course_enrollment";
      } else if (type === "plan") {
        const membership = await db
          .collection("black_card_memberships")
          .findOne({
            $or: [{ stripeSessionId: p.stripeSessionId }, { userId: p.userId }],
          });
        entitlement = {
          kind: "plan",
          blackCardMembershipFound: Boolean(membership),
          membershipId: membership?._id ? String(membership._id) : null,
        };
        if (
          String(p.status).toLowerCase() === "paid" &&
          !membership &&
          String(p.itemId || "").includes("black-card")
        )
          failurePoint = "paid_without_black_card_membership";
      } else if (type === "product") {
        entitlement = {
          kind: "product",
          orderId: p?.metadata?.orderId || null,
        };
        if (String(p.status).toLowerCase() === "paid" && !p?.metadata?.orderId)
          failurePoint = "paid_product_missing_order_reference";
      }

      return {
        payment: {
          stripeSessionId: p.stripeSessionId || null,
          paymentIntentId: p.paymentIntentId || null,
          userId: p.userId || null,
          email: p.email || null,
          type,
          itemId: p.itemId || null,
          status: p.status || null,
          fulfillmentStatus: p.fulfillmentStatus || null,
          entitlementStatus: p.entitlementStatus || null,
          createdAt: p.createdAt || null,
        },
        entitlement,
        verification: {
          failurePoint,
          canRepair:
            String(p.status).toLowerCase() === "paid" && Boolean(failurePoint),
        },
      };
    }),
  );

  return res.status(200).json({
    ok: true,
    items,
    meta: {
      count: items.length,
      requestedBy: admin.email || admin.userId || "admin",
    },
  });
}
