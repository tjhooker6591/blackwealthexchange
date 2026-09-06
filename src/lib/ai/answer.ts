// src/lib/ai/answer.ts
//
// Phase 7 -- BWE AI Mode answer synthesis. Two layers, always in this
// order:
//
//   1. A deterministic, structured summary built directly from the real
//      grounded data (src/lib/ai/grounding.ts) -- this ALWAYS runs, needs
//      no external AI credentials, and is itself a complete, honest
//      answer to the natural-language query.
//   2. If OPENAI_API_KEY is configured, an optional prose rewrite of that
//      same structured summary, following the exact grounded-citation
//      pattern already proven in src/pages/api/ai/answers.ts: the model
//      is given only the real grounded facts and is explicitly forbidden
//      from adding anything not present in them.
//
// The response always reports which layer actually produced the text
// (`source: "structured" | "ai"`) so the caller/UI can be honest about it.

import type { AiIntent } from "./intent";
import type { AiGroundedResult } from "./grounding";

function formatCents(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function buildStructuredAnswer(
  intent: AiIntent,
  grounded: AiGroundedResult,
): string {
  if (grounded.kind === "capability") {
    if (!grounded.capabilities.length) {
      return "I couldn't find a BWE feature matching that. Try /explore to see everything BWE offers.";
    }
    const top = grounded.capabilities.slice(0, 5);
    return `Here's where to go on BWE: ${top.map((c) => `${c.label} (${c.href})`).join(", ")}.`;
  }

  if (grounded.kind === "economic") {
    const measured = grounded.metrics.filter(
      (m) => m.status === "measured" && m.value !== null,
    );
    if (!measured.length) {
      return "BWE doesn't have enough verified data yet to answer that economic question honestly.";
    }
    const parts = measured.slice(0, 4).map((m) => {
      const value =
        m.unit === "usd_cents"
          ? formatCents(m.value as number)
          : String(m.value);
      return `${m.label}: ${value}`;
    });
    return `Here's what BWE has actually measured: ${parts.join("; ")}.`;
  }

  if (grounded.kind === "saved") {
    if (grounded.requiresAuth) {
      return "Log in to BWE to see your saved and followed businesses.";
    }
    if (!grounded.businesses.length) {
      return "You haven't saved any businesses yet. Save one from any business page to see it here.";
    }
    return `You've saved ${grounded.businesses.length} business${grounded.businesses.length === 1 ? "" : "es"}: ${grounded.businesses
      .slice(0, 5)
      .map((b) => b.displayName)
      .join(", ")}.`;
  }

  // search
  const count = grounded.results.length;
  if (count === 0) {
    const filters: string[] = [];
    if (intent.location) filters.push(`near ${intent.location}`);
    if (intent.maxPriceCents !== null)
      filters.push(`under ${formatCents(intent.maxPriceCents)}`);
    return `No real BWE results matched "${intent.keyword || intent.rawQuery}"${
      filters.length ? ` ${filters.join(", ")}` : ""
    } right now.`;
  }
  const top = grounded.results.slice(0, 5).map((r) => r.title);
  return `Found ${count} real result${count === 1 ? "" : "s"} on BWE: ${top.join(", ")}${
    count > top.length ? ", and more" : ""
  }.`;
}

type LlmAnswerResult = { text: string; source: "ai" } | null;

/**
 * Optional prose layer. Grounded strictly to the same structured facts --
 * see the module doc above. Returns null (never throws) if no API key is
 * configured or the call fails, so the caller always has the structured
 * answer as a guaranteed fallback.
 */
export async function tryLlmAnswer(
  intent: AiIntent,
  grounded: AiGroundedResult,
  structuredAnswer: string,
): Promise<LlmAnswerResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENAI_MODEL || "gpt-5.2";
  const factsJson = JSON.stringify(grounded).slice(0, 6000);

  const system = [
    "You are BWE AI Mode, the discovery assistant for Black Wealth Exchange.",
    "You are given real grounded facts as JSON and a structured fallback answer.",
    "Rewrite the structured answer as 1-3 friendly, concise sentences.",
    "You MUST NOT mention any business, product, job, opportunity, or number that is not present in the provided facts.",
    "Never invent data. If the facts are empty or insufficient, say so plainly.",
  ].join(" ");

  const user = [
    `User query: ${intent.rawQuery}`,
    "",
    `Grounded facts (JSON, the only source of truth you may use):`,
    factsJson,
    "",
    `Structured fallback answer: ${structuredAnswer}`,
  ].join("\n");

  try {
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        text: { verbosity: "low" },
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;
    const data = await res.json();

    let text = "";
    if (typeof data?.output_text === "string") text = data.output_text;
    else if (Array.isArray(data?.output)) {
      for (const item of data.output) {
        const content = item?.content;
        if (Array.isArray(content)) {
          const c0 =
            content.find((c: any) => typeof c?.text === "string") || content[0];
          if (typeof c0?.text === "string") {
            text = c0.text;
            break;
          }
        }
      }
    }

    text = text.trim();
    if (!text) return null;
    return { text, source: "ai" };
  } catch {
    return null;
  }
}
