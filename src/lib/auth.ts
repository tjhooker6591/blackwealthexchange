// File: lib/auth.ts
import { NextApiRequest } from "next";
import { verify } from "jsonwebtoken"; // or whatever you use for JWTs

// Make sure this matches how you sign your session token
const JWT_SECRET = process.env.JWT_SECRET!;

export interface SessionUser {
  email: string;
  accountType: string;
  // any other fields you embed in the token
}

// Reads the HTTP‑only cookie named `session_token`, verifies it,
// and returns the decoded user payload (or null if invalid).
export async function getUserFromRequest(
  req: NextApiRequest,
): Promise<SessionUser | null> {
  const token = req.cookies.session_token;
  if (!token) return null;

  try {
    const payload = verify(token, JWT_SECRET) as SessionUser;
    return payload;
  } catch (err) {
    console.error("Invalid session token:", err);
    return null;
  }
}
