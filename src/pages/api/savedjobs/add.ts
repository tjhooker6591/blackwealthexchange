import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  return res.status(410).json({
    code: "LEGACY_SAVED_JOB_ROUTE_RETIRED",
    message:
      "Legacy saved-jobs route is retired. Use the authenticated user save-job APIs.",
  });
}
