// src/pages/api/auth/request-reset.ts

import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Placeholder route for handling password reset requests.
 * This implementation is safe for production and avoids deployment errors.
 * Later, you can add logic to send reset emails, tokens, etc.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ error: "Method Not Allowed. Use POST instead." });
  }

  // Placeholder: accept and log the request, but do not process it yet
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  // In production, you'd send an email here or generate a token
  console.log(`Password reset requested for: ${email}`);

  return res
    .status(200)
    .json({ message: "If this email exists, reset instructions will be sent." });
}
