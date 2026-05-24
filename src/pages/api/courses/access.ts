import type { NextApiRequest, NextApiResponse } from "next";
import { resolvePremiumCourseAccess } from "@/lib/entitlements/courseAccess";

type AccessResponse = {
  ok: boolean;
  authenticated: boolean;
  hasAccess: boolean;
  reason?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AccessResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({
      ok: false,
      authenticated: false,
      hasAccess: false,
      reason: "method_not_allowed",
    });
  }

  try {
    const access = await resolvePremiumCourseAccess(req);
    return res.status(200).json({
      ok: true,
      authenticated: access.authenticated,
      hasAccess: access.hasAccess,
      reason: access.reason,
    });
  } catch (error) {
    console.error("GET /api/courses/access error", error);
    return res.status(500).json({
      ok: false,
      authenticated: false,
      hasAccess: false,
      reason: "internal_error",
    });
  }
}
