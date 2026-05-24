import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import clientPromise from "@/lib/mongodb";
import cookie from "cookie";
import { ObjectId } from "mongodb";
import { getJwtSecret, getMongoDbName } from "@/lib/env";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";
import {
  getAuthCookieDomain,
  getAuthCookieSecure,
  SESSION_TTL_LABEL,
  SESSION_TTL_SECONDS,
} from "@/lib/authCookiePolicy";

interface UserRecord {
  _id: ObjectId;
  email: string;
  password?: string;
  accountType: string;
  isAdmin?: boolean;
  tokenVersion?: number;
  [key: string]: unknown;
}

const ADMIN_EMAIL = "blackwealth24@gmail.com";

function normalizeEmail(email: string) {
  return (email || "").trim().toLowerCase();
}

// Escape regex special chars for safe fallback match
function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  let SECRET: string;
  try {
    SECRET = getJwtSecret();
  } catch (err) {
    console.error("Login handler secret load failed:", err);
    return res
      .status(500)
      .json({ success: false, error: "Server configuration error." });
  }

  try {
    const dbgHost = String(req.headers.host || "");
    const dbgProto = String(req.headers["x-forwarded-proto"] || "");
    const dbgCookieNames = Object.keys(cookie.parse(req.headers.cookie || ""));

    if (req.method !== "POST") {
      res.setHeader("Allow", ["POST"]);
      return res
        .status(405)
        .json({ success: false, error: "Method Not Allowed" });
    }

    const {
      email,
      password,
      accountType: bodyAccountType,
    } = req.body as {
      email: string;
      password: string;
      accountType?: "user" | "business" | "seller" | "employer";
    };

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, error: "Email and password are required." });
    }

    const emailNorm = normalizeEmail(email);
    console.info("[auth/login] request", {
      host: dbgHost,
      proto: dbgProto,
      cookieNames: dbgCookieNames,
      accountType: bodyAccountType || null,
      email: emailNorm,
    });

    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    await ensureApiRateLimitIndexes(db);
    const ip = getClientIp(req);

    const ipLimit = await hitApiRateLimit(db, `login:ip:${ip}`, 30, 10);
    const emailLimit = await hitApiRateLimit(
      db,
      `login:email:${emailNorm}`,
      10,
      10,
    );

    if (ipLimit.blocked || emailLimit.blocked) {
      res.setHeader(
        "Retry-After",
        String(
          Math.max(ipLimit.retryAfterSeconds, emailLimit.retryAfterSeconds),
        ),
      );
      return res.status(429).json({
        success: false,
        error: "Too many login attempts. Please try again shortly.",
      });
    }

    const roleCollections: Array<{
      role: "user" | "business" | "seller" | "employer";
      coll: "users" | "businesses" | "sellers" | "employers";
    }> = [
      { role: "user", coll: "users" },
      { role: "business", coll: "businesses" },
      { role: "seller", coll: "sellers" },
      { role: "employer", coll: "employers" },
    ];

    const preferredOrder = bodyAccountType
      ? [
          ...roleCollections.filter((x) => x.role === bodyAccountType),
          ...roleCollections.filter((x) => x.role !== bodyAccountType),
        ]
      : roleCollections;

    let user: UserRecord | null = null;
    let resolvedRole: "user" | "business" | "seller" | "employer" =
      bodyAccountType || "user";

    for (const entry of preferredOrder) {
      const collection = db.collection<UserRecord>(entry.coll);
      user = await collection.findOne({ email: emailNorm });
      if (!user) {
        user = await collection.findOne({
          email: { $regex: `^${escapeRegex(email.trim())}$`, $options: "i" },
        });
      }
      if (!user) {
        user = await collection.findOne({
          ownerEmail: {
            $regex: `^${escapeRegex(email.trim())}$`,
            $options: "i",
          },
        } as any);
      }
      if (!user) {
        user = await collection.findOne({
          business_email: {
            $regex: `^${escapeRegex(email.trim())}$`,
            $options: "i",
          },
        } as any);
      }
      if (user) {
        resolvedRole = entry.role;
        break;
      }
    }

    if (!user) {
      console.info("[auth/login] user_not_found", {
        email: emailNorm,
        accountType: bodyAccountType || null,
      });
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials." });
    }

    // Do not hard-fail on drifted accountType field inside role collections.
    // The selected route collection is the source of truth for this login context.

    // Must have a password hash to login (unless you later support OAuth)
    const storedPasswordHash =
      typeof user.password === "string" && user.password
        ? user.password
        : typeof (user as any).passwordHash === "string"
          ? (user as any).passwordHash
          : "";

    if (!storedPasswordHash) {
      return res.status(401).json({
        success: false,
        error:
          "This account does not have a password set. Please use Forgot Password to set one.",
      });
    }

    const isValid = await bcrypt.compare(password, storedPasswordHash);
    if (!isValid) {
      console.info("[auth/login] password_invalid", {
        email: emailNorm,
        resolvedRole,
      });
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials." });
    }

    const role = resolvedRole || bodyAccountType || user.accountType || "user";

    // Canonical admin permission comes from the users identity record,
    // not from role-specific collection accountType values.
    const canonicalUser = await db
      .collection<UserRecord>("users")
      .findOne({ email: emailNorm }, { projection: { isAdmin: 1 } });

    const isAdmin =
      emailNorm === normalizeEmail(ADMIN_EMAIL) ||
      canonicalUser?.isAdmin === true ||
      user.isAdmin === true;

    const tokenVersion =
      typeof user.tokenVersion === "number" &&
      Number.isFinite(user.tokenVersion)
        ? user.tokenVersion
        : 0;

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: emailNorm,
        accountType: role,
        isAdmin,
        tokenVersion,
      },
      SECRET,
      { expiresIn: SESSION_TTL_LABEL },
    );

    const host = (req.headers.host || "").toLowerCase();
    const isLocalHost =
      host.startsWith("localhost") ||
      host.startsWith("127.0.0.1") ||
      host.startsWith("[::1]");
    const isProd = isLocalHost ? false : getAuthCookieSecure();
    const cookieDomain = isLocalHost ? undefined : getAuthCookieDomain();

    res.setHeader("Set-Cookie", [
      cookie.serialize("session_token", token, {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_TTL_SECONDS,
        domain: cookieDomain,
      }),
      cookie.serialize("accountType", role, {
        httpOnly: false,
        secure: isProd,
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_TTL_SECONDS,
        domain: cookieDomain,
      }),
    ]);

    console.info("[auth/login] success", {
      host: dbgHost,
      proto: dbgProto,
      resolvedRole: role,
      cookieDomain: cookieDomain || "<host-only>",
      cookieSecure: isProd,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        // return BOTH styles so your frontends don’t break
        id: user._id.toString(),
        userId: user._id.toString(),
        email: emailNorm,
        accountType: role,
        isAdmin,
      },
    });
  } catch (err) {
    console.error("Login handler unexpected error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
}
