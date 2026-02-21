// src/pages/api/events/rss.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Parser from "rss-parser";

type OutItem = {
  title: string;
  link?: string;
  isoDate?: string;
  source?: string;
  snippet?: string;
};

function hostOf(u: string) {
  try {
    return new URL(u).hostname.toLowerCase();
  } catch {
    return "";
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // CDN cache (Vercel) – keeps your page fast
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");

  const urlsRaw = process.env.BWE_EVENTS_RSS_URLS || "";
  const allowRaw = process.env.BWE_EVENTS_RSS_ALLOWLIST || "";

  const urls = urlsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const allow = new Set(
    allowRaw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );

  // If not configured, return empty list (no hard error)
  if (urls.length === 0) return res.status(200).json({ items: [] });

  // SSRF safety: require allowlist
  if (allow.size === 0) {
    return res.status(400).json({
      error:
        "RSS allowlist not configured. Set BWE_EVENTS_RSS_ALLOWLIST to permitted hostnames.",
    });
  }

  const parser = new Parser({
    timeout: 12000,
    headers: { "User-Agent": "BWE-EventsBot/1.0" },
  });

  const out: OutItem[] = [];

  for (const url of urls) {
    if (!url.startsWith("https://")) continue;

    const host = hostOf(url);
    if (!allow.has(host)) continue;

    try {
      const feed = await parser.parseURL(url);
      const source = feed.title || host;

      for (const item of feed.items || []) {
        out.push({
          title: item.title || "Untitled",
          link: item.link || undefined,
          isoDate:
            (item.isoDate as string) || (item.pubDate as string) || undefined,
          source,
          snippet:
            (item.contentSnippet as string) ||
            (typeof item.content === "string"
              ? item.content.slice(0, 240)
              : undefined),
        });
      }
    } catch {
      // ignore per-feed failures so one broken feed doesn't kill results
      continue;
    }
  }

  // newest first
  out.sort((a, b) => {
    const ad = a.isoDate ? new Date(a.isoDate).getTime() : 0;
    const bd = b.isoDate ? new Date(b.isoDate).getTime() : 0;
    return bd - ad;
  });

  return res.status(200).json({ items: out.slice(0, 60) });
}
