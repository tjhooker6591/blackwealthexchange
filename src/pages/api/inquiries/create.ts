import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";
import {
  createInquiry,
  ensureInquiryIndexes,
  InquiryError,
  processPendingForwards,
} from "@/lib/inquiries/service";
import { inquiryDeps } from "@/lib/inquiries/deps";

// Public contact form. The inquiry is saved before anything else happens;
// a reply, team alert or Speed-to-Lead hand-off that fails never fails this.
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  const body =
    typeof req.body === "string"
      ? JSON.parse(req.body || "{}")
      : req.body || {};
  const db = (await clientPromise).db(getMongoDbName());
  await ensureApiRateLimitIndexes(db);
  const limit = await hitApiRateLimit(
    db,
    `inquiries:create:ip:${getClientIp(req)}`,
    8,
    30,
  );
  if (limit.blocked) {
    res.setHeader("Retry-After", String(limit.retryAfterSeconds));
    return res
      .status(429)
      .json({
        ok: false,
        error: "Too many messages. Please try again in a little while.",
      });
  }
  try {
    await ensureInquiryIndexes(db);
    const deps = inquiryDeps();
    const result = await createInquiry(db, body, deps);
    // Retry earlier hand-offs that are due while we're here.
    processPendingForwards(db, deps, 5).catch(() => null);
    return res.status(201).json(result);
  } catch (e: any) {
    if (e instanceof InquiryError)
      return res
        .status(400)
        .json({ ok: false, error: e.message, field: e.field });
    console.error("[inquiries/create]", e?.message || e);
    return res
      .status(500)
      .json({
        ok: false,
        error: "We couldn't send your message. Please try again.",
      });
  }
}
