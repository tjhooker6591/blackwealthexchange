import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { grantCourseAccess } from "@/lib/db/courses";
import { ensureFinancialClassIndexes } from "@/lib/financialClassIndexes";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  const stripeSessionId = String(req.body?.stripeSessionId || "").trim();
  const reason = String(req.body?.reason || "").trim() || "admin_repair";

  if (!stripeSessionId) {
    return res
      .status(400)
      .json({ ok: false, error: "stripeSessionId is required" });
  }

  const client = await clientPromise;
  const db = client.db(getMongoDbName());
  await ensureFinancialClassIndexes(db);

  const payment = await db.collection("payments").findOne({ stripeSessionId });
  if (!payment) {
    return res.status(404).json({ ok: false, error: "Payment not found" });
  }

  if (String(payment.status || "").toLowerCase() !== "paid") {
    return res
      .status(409)
      .json({ ok: false, error: "Payment is not marked paid" });
  }

  const userId = String(payment.userId || "").trim();
  const courseId =
    String(payment?.metadata?.courseId || "").trim() ||
    String(payment.itemId || "").trim();

  if (!userId || !courseId) {
    return res.status(409).json({
      ok: false,
      error: "Cannot repair without both userId and courseId",
    });
  }

  const grant = await grantCourseAccess(userId, courseId, {
    stripeSessionId,
    paymentIntentId: String(payment.paymentIntentId || "") || null,
    source: "admin_repair",
    repairedBy: admin.email || admin.userId || "admin",
    reason,
    paymentStatus: "paid",
    purchasedAt: new Date(
      payment.paidAt || payment.updatedAt || payment.createdAt || Date.now(),
    ),
    email: String(payment.email || payment?.metadata?.email || "") || null,
    courseName: String(
      payment?.metadata?.courseName || payment?.metadata?.itemName || courseId,
    ),
    sendAccessEmail: true,
  });

  const now = new Date();

  await db.collection("payments").updateOne(
    { stripeSessionId },
    {
      $set: {
        fulfillmentStatus: "fulfilled",
        entitlementStatus: "granted",
        reconciliationState: "repaired",
        reconciliationReason: reason,
        lastReconciledAt: now,
        updatedAt: now,
      },
    },
  );

  await db.collection("financial_class_admin_audit").insertOne({
    action: "grant_missing_enrollment",
    stripeSessionId,
    paymentIntentId: payment.paymentIntentId || null,
    userId,
    courseId,
    reason,
    actorId: admin.userId || null,
    actorEmail: admin.email || null,
    createdAt: now,
  });

  return res.status(200).json({
    ok: true,
    repaired: true,
    stripeSessionId,
    userId,
    courseId,
    enrollmentUpserted: grant.enrollmentUpserted,
  });
}
