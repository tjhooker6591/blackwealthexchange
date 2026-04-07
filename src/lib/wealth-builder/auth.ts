import type { NextApiRequest, NextApiResponse } from "next";
import { verify, type JwtPayload } from "jsonwebtoken";
import { getWealthDb } from "./mongo";
import { toObjectId } from "./helpers";

type WealthAuthResult = {
  userId: string;
  accountType: "user";
  email: string | null;
  user: Record<string, any>;
};

function getSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("Missing JWT_SECRET or NEXTAUTH_SECRET");
  }
  return secret;
}

function getStringClaim(payload: JwtPayload, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return undefined;
}

export async function requireWealthUser(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<WealthAuthResult | null> {
  try {
    const token = req.cookies?.session_token;

    if (!token) {
      res.status(401).json({ ok: false, message: "Authentication required." });
      return null;
    }

    const decoded = verify(token, getSecret());
    if (typeof decoded === "string") {
      res.status(401).json({ ok: false, message: "Invalid session token." });
      return null;
    }

    const payload = decoded as JwtPayload;
    const payloadAccountType =
      getStringClaim(payload, ["accountType", "role"]) || req.cookies?.accountType || "user";

    if (payloadAccountType !== "user") {
      res.status(403).json({
        ok: false,
        message: "Wealth Builder is currently available to user accounts only.",
      });
      return null;
    }

    const rawUserId = getStringClaim(payload, ["userId", "id", "sub"]);
    if (!rawUserId) {
      res.status(401).json({ ok: false, message: "Unable to resolve user from session." });
      return null;
    }

    const db = await getWealthDb();
    const users = db.collection("users");

    let user =
      (toObjectId(rawUserId) && (await users.findOne({ _id: toObjectId(rawUserId)! }))) ||
      (await users.findOne({ _id: rawUserId as any }));

    if (!user) {
      user = await users.findOne({ email: getStringClaim(payload, ["email"]) || null });
    }

    if (!user) {
      res.status(401).json({ ok: false, message: "Authenticated user record not found." });
      return null;
    }

    return {
      userId: user._id.toString(),
      accountType: "user",
      email: typeof user.email === "string" ? user.email : null,
      user,
    };
  } catch (error) {
    console.error("Wealth auth error:", error);
    res.status(401).json({ ok: false, message: "Authentication failed." });
    return null;
  }
}
