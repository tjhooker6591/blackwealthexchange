import type { NextApiRequest, NextApiResponse } from "next";

function extractOutputText(resp: any): string {
  if (typeof resp?.output_text === "string") return resp.output_text;

  const output = resp?.output;
  if (Array.isArray(output)) {
    for (const item of output) {
      // usually: { type:"message", content:[{type:"output_text", text:"..."}] }
      const content = item?.content;
      if (Array.isArray(content)) {
        const c0 =
          content.find((c: any) => typeof c?.text === "string") || content[0];
        if (typeof c0?.text === "string") return c0.text;
      }
    }
  }
  return "";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "POST only" });

  const { query } = (req.body || {}) as { query?: string };
  const q = (query || "").trim();
  if (!q) return res.status(400).json({ error: "Missing query" });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(501).json({
      error:
        "AI Mode requires OPENAI_API_KEY (server env). Add it in Vercel + local .env and retry.",
    });
  }

  const model = process.env.OPENAI_MODEL || "gpt-5.2";

  // Pull trusted context from your own News aggregator (no scraping on the client)
  const proto = (req.headers["x-forwarded-proto"] as string) || "http";
  const host = req.headers.host;
  const base = `${proto}://${host}`;

  let sources: Array<{
    title: string;
    url: string;
    source: string;
    publishedAt?: string;
  }> = [];
  try {
    const newsRes = await fetch(
      `${base}/api/news/black?q=${encodeURIComponent(q)}&limit=8`,
    );
    const news = await newsRes.json();
    const items = Array.isArray(news?.items) ? news.items : [];
    sources = items.slice(0, 8).map((it: any) => ({
      title: it.title,
      url: it.url,
      source: it.source,
      publishedAt: it.publishedAt,
    }));
  } catch {
    // if news fails, AI still answers with general guidance (but will say sources unavailable)
  }

  const sourcesText =
    sources.length > 0
      ? sources
          .map((s, i) => `${i + 1}. ${s.title} — ${s.source} (${s.url})`)
          .join("\n")
      : "No sources available.";

  const system = [
    "You are BWE AI Overview.",
    "Write a concise, trustworthy overview for the user’s query.",
    "If sources are provided, you MUST cite them using bracket numbers like [1], [2].",
    "Do not invent citations. If sources are insufficient, say so briefly.",
    "Tone: clear, confident, non-political persuasion, no hype.",
  ].join(" ");

  const user = [
    `Query: ${q}`,
    "",
    "Sources:",
    sourcesText,
    "",
    "Output format:",
    "1 short paragraph overview (2–4 sentences).",
    "Then 3–6 bullet points, each with citations when applicable.",
  ].join("\n");

  try {
    const r = await fetch("https://api.openai.com/v1/responses", {
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
    });

    const data = await r.json();
    if (!r.ok) {
      return res.status(500).json({
        error: data?.error?.message || "OpenAI call failed",
      });
    }

    const text = extractOutputText(data) || "";
    return res.status(200).json({
      model,
      text,
      sources,
    });
  } catch (e: any) {
    return res.status(500).json({
      error: e?.message || "AI Mode failed",
    });
  }
}
