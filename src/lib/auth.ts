// lib/auth.ts

import type { NextApiRequest } from "next";
import { verify } from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";

/**
 * SessionUser represents the decoded payload of the session token.
 * You must include `id` when you sign the JWT:
 *
 *   jwt.sign({ id: user._id.toHexString(), email: user.email, accountType: user.accountType }, JWT_SECRET)
 */
export interface SessionUser {
  /** MongoDB user ID, stringified */
  id: string;

  /** User’s email address */
  email: string;

  /** User’s role */
  accountType: "user" | "seller" | "employer";

  // …any other fields you embed in the token
}

/**
 * Reads the HTTP-only cookie named `session_token`, verifies it,
 * and returns the decoded user payload (or null if invalid).
 */
export async function getUserFromRequest(
  req: NextApiRequest,
): Promise<SessionUser | null> {
  const token = req.cookies.session_token;
  if (!token) return null;

  try {
    // Now payload will include `id`, `email`, and `accountType`
    const payload = verify(token, getJwtSecret()) as SessionUser;
    return payload;
  } catch (err) {
    console.error("Invalid session token:", err);
    return null;
  }
}
