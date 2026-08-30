import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  return res.status(410).json({
    code: "LEGACY_ENROLLMENT_RETIRED",
    message:
      "Legacy enrollment is retired. Use the canonical checkout and entitlement verification flow.",
  });
}
