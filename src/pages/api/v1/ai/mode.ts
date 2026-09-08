// src/pages/api/v1/ai/mode.ts
//
// Phase 7 -- BWE AI Mode + Natural-Language Economic Discovery. The first
// route under the new /api/v1/ convention (see docs/API_PLATFORM.md).
// Grounds every answer in real BWE data via src/lib/ai/intent.ts +
// grounding.ts + answer.ts -- never fabricates a business, product, job,
// opportunity, or economic figure, and never exposes another user's
// private data (the "saved" domain only resolves for the caller's own
// authenticated session).

import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { getNetworkSession } from "@/lib/network/shared";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";
import { logHealthEvent } from "@/lib/observability/logHealthEvent";
import { parseAiIntent } from "@/lib/ai/intent";
import { resolveAiGrounding } from "@/lib/ai/grounding";
import { buildStructuredAnswer, tryLlmAnswer } from "@/lib/ai/answer";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({
      ok: false,
      error: { code: "METHOD_NOT_ALLOWED", message: "POST only" },
    });
  }

  const body: any =
    typeof req.body === "string"
      ? JSON.parse(req.body || "{}")
      : req.body || {};
  const rawQuery = typeof body.query === "string" ? body.query.trim() : "";
  if (!rawQuery) {
    return res.status(400).json({
      ok: false,
      error: { code: "MISSING_QUERY", message: "query is required" },
    });
  }

  const client = await clientPromise;
  const db = client.db(getMongoDbName());

  await ensureApiRateLimitIndexes(db).catch(() => null);
  const ip = getClientIp(req);
  const limit = await hitApiRateLimit(db, `ai-mode:ip:${ip}`, 30, 5);
  if (limit.blocked) {
    res.setHeader("Retry-After", String(limit.retryAfterSeconds));
    return res.status(429).json({
      ok: false,
      error: {
        code: "RATE_LIMITED",
        message: "Too many AI Mode requests. Try again shortly.",
      },
    });
  }

  const session = getNetworkSession(req);
  const startedAt = Date.now();

  try {
    const intent = parseAiIntent(rawQuery);
    const grounded = await resolveAiGrounding(db, intent, session);
    const structuredAnswer = buildStructuredAnswer(intent, grounded);
    const llmAnswer = await tryLlmAnswer(intent, grounded, structuredAnswer);

    return res.status(200).json({
      ok: true,
      data: {
        intent,
        grounded,
        answer: llmAnswer?.text || structuredAnswer,
        answerSource: llmAnswer ? "ai" : "structured",
        aiConfigured: Boolean(process.env.OPENAI_API_KEY),
      },
    });
  } catch (error) {
    console.error("[api/v1/ai/mode] failed:", error);
    await logHealthEvent(db, {
      component: "ai_mode",
      route: "/api/v1/ai/mode",
      status: "fail",
      httpStatus: 500,
      message: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - startedAt,
    });
    return res.status(500).json({
      ok: false,
      error: {
        code: "AI_MODE_FAILED",
        message: "AI Mode could not process this query.",
      },
    });
  }
}
