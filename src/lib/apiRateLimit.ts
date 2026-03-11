import type { NextApiRequest } from "next";

export function getClientIp(req: NextApiRequest) {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

export async function ensureApiRateLimitIndexes(db: any) {
  await db
    .collection("api_rate_limits")
    .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await db.collection("api_rate_limits").createIndex({ key: 1, createdAt: -1 });
}

export async function hitApiRateLimit(
  db: any,
  key: string,
  limit: number,
  windowMinutes: number,
) {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000);
  const expiresAt = new Date(now.getTime() + windowMinutes * 60 * 1000);

  const col = db.collection("api_rate_limits");
  const count = await col.countDocuments({
    key,
    createdAt: { $gte: windowStart },
  });
  await col.insertOne({ key, createdAt: now, expiresAt });

  return {
    blocked: count >= limit,
    retryAfterSeconds: windowMinutes * 60,
  };
}
