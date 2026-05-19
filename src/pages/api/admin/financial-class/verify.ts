import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { ObjectId } from "mongodb";
import { ensureFinancialClassIndexes } from "@/lib/financialClassIndexes";

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
  const courseId = String(req.query.courseId || "").trim();

  if (!email && !userId && !stripeSessionId && !paymentIntentId) {
    return res.status(400).json({
      ok: false,
      error:
        "Provide at least one lookup: email, userId, stripeSessionId, or paymentIntentId",
    });
  }

  const client = await clientPromise;
  const db = client.db(getMongoDbName());
  await ensureFinancialClassIndexes(db);

  const paymentQuery: any = {
    $or: [{ type: "course" }, { "metadata.type": "course" }],
  };

  const and: any[] = [];
  if (email) and.push({ email });
  if (userId) and.push({ userId });
  if (stripeSessionId) and.push({ stripeSessionId });
  if (paymentIntentId) and.push({ paymentIntentId });
  if (courseId)
    and.push({
      $or: [{ itemId: courseId }, { "metadata.courseId": courseId }],
    });

  if (and.length) paymentQuery.$and = and;

  const payments = await db
    .collection("payments")
    .find(paymentQuery)
    .sort({ createdAt: -1 })
    .limit(20)
    .toArray();

  const rows = await Promise.all(
    payments.map(async (p: any) => {
      const resolvedCourseId =
        String(p?.metadata?.courseId || "").trim() ||
        String(p?.itemId || "").trim();
      const resolvedUserId = String(p?.userId || "").trim();

      const enrollment =
        resolvedUserId && resolvedCourseId
          ? await db.collection("enrollments").findOne({
              userId: resolvedUserId,
              courseId: resolvedCourseId,
            })
          : null;

      const user = resolvedUserId
        ? await db
            .collection("users")
            .findOne(
              ObjectId.isValid(resolvedUserId)
                ? { _id: new ObjectId(resolvedUserId) }
                : { email: String(p.email || "").toLowerCase() },
              { projection: { purchasedCourses: 1, email: 1 } },
            )
        : null;

      const purchasedCourses = Array.isArray(user?.purchasedCourses)
        ? user.purchasedCourses.map((x: any) => String(x))
        : [];

      const hasPurchasedCourse = resolvedCourseId
        ? purchasedCourses.includes(resolvedCourseId)
        : false;

      const entitlementStatus =
        enrollment || hasPurchasedCourse ? "granted" : "missing";
      const fulfillmentStatus =
        entitlementStatus === "granted" ? "fulfilled" : "unfulfilled";

      const repairAudit = await db
        .collection("financial_class_admin_audit")
        .find({
          $or: [
            { stripeSessionId: p.stripeSessionId || null },
            {
              userId: resolvedUserId || null,
              courseId: resolvedCourseId || null,
            },
          ],
        })
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray();

      return {
        payment: {
          stripeSessionId: p.stripeSessionId || null,
          paymentIntentId: p.paymentIntentId || null,
          userId: p.userId || null,
          email: p.email || null,
          itemId: p.itemId || null,
          courseId: resolvedCourseId || null,
          amountCents: p.amountCents || null,
          status: p.status || null,
          paidAt: p.paidAt || null,
          createdAt: p.createdAt || null,
        },
        enrollment: enrollment
          ? {
              id: String(enrollment._id),
              userId: enrollment.userId,
              email: enrollment.email || null,
              courseId: enrollment.courseId,
              courseName: enrollment.courseName || null,
              entitlementStatus: enrollment.entitlementStatus || null,
              accessStatus: enrollment.accessStatus || null,
              paymentStatus: enrollment.paymentStatus || null,
              entitlementType: enrollment.entitlementType || null,
              source: enrollment.source || null,
              sourceStripeSessionId: enrollment.sourceStripeSessionId || null,
              sourcePaymentIntentId: enrollment.sourcePaymentIntentId || null,
              grantedBy: enrollment.grantedBy || null,
              purchasedAt: enrollment.purchasedAt || null,
              grantedAt: enrollment.grantedAt || null,
              updatedAt: enrollment.updatedAt || null,
              courseEmailStatus: enrollment.courseEmailStatus || null,
              courseEmailEvents: Array.isArray(enrollment.courseEmailEvents)
                ? enrollment.courseEmailEvents.slice(-5)
                : [],
            }
          : null,
        purchasedCourseMirror: hasPurchasedCourse,
        verification: {
          paymentPaid: String(p.status || "").toLowerCase() === "paid",
          entitlementStatus,
          fulfillmentStatus,
          canRepair:
            String(p.status || "").toLowerCase() === "paid" &&
            Boolean(resolvedUserId && resolvedCourseId),
          failurePoint:
            entitlementStatus === "missing"
              ? "paid_without_enrollment_or_course_access"
              : null,
          recommendedRepairAction:
            entitlementStatus === "missing"
              ? "grant_missing_enrollment_from_paid_session"
              : null,
        },
        repairAudit: repairAudit.map((a: any) => ({
          id: String(a._id),
          action: a.action || null,
          reason: a.reason || null,
          actorEmail: a.actorEmail || null,
          createdAt: a.createdAt || null,
        })),
      };
    }),
  );

  return res.status(200).json({
    ok: true,
    items: rows,
    meta: {
      count: rows.length,
      requestedBy: admin.email || admin.userId || "admin",
    },
  });
}
