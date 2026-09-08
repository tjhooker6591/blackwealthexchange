import type { NextApiRequest, NextApiResponse } from "next";
import { verifyAndGrantCourseSession } from "@/lib/db/courses";

type VerifyResponse = {
  ok: boolean;
  paid?: boolean;
  userId?: string;
  courseId?: string;
  enrollmentCreated?: boolean;
  reason?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VerifyResponse>,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, reason: "method_not_allowed" });
  }

  const sessionId =
    typeof req.query.session_id === "string" ? req.query.session_id.trim() : "";

  if (!sessionId) {
    return res.status(400).json({ ok: false, reason: "missing_session_id" });
  }

  const result = await verifyAndGrantCourseSession(sessionId);
  if (!result.ok && result.reason === "stripe_not_configured") {
    return res.status(500).json(result);
  }
  if (!result.ok) {
    return res.status(500).json(result);
  }
  return res.status(200).json(result);
}
