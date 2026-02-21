// src/pages/api/news/black.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Parser from "rss-parser";

type Region = "US" | "Africa" | "Global";

type Source = {
  id: string;
  name: string;
  region: Region;
  url: string;
  tags?: Array<"news" | "business" | "entertainment">;
};

type NewsItem = {
  id: string;
  title: string;
  url: string;
  source: string;
  region: Region;
  publishedAt?: string;
  snippet?: string;
  image?: string | null;
  tags?: Array<"news" | "business" | "entertainment">;
};

const SOURCES: Source[] = [
  // --- US (general Black news/business) ---
  {
    id: "thegrio",
    name: "TheGrio",
    region: "US",
    url: "https://thegrio.com/feed/",
    tags: ["news", "entertainment"],
  },
  {
    id: "shoppeblack",
    name: "Shoppe Black",
    region: "US",
    url: "https://shoppeblack.us/feed/",
    tags: ["business"],
  },
  {
    id: "atlantablackstar",
    name: "Atlanta Black Star",
    region: "US",
    url: "https://atlantablackstar.com/feed/",
    tags: ["news", "entertainment"],
  },
  {
    id: "blackenterprise",
    name: "Black Enterprise",
    region: "US",
    url: "https://www.blackenterprise.com/feed/",
    tags: ["business"],
  },

  // --- US (entertainment-heavy) ---
  {
    id: "eurweb",
    name: "EURweb",
    region: "US",
    url: "https://eurweb.com/feed/",
    tags: ["entertainment"],
  }, // :contentReference[oaicite:7]{index=7}
  {
    id: "blackamericaweb_ent",
    name: "Black America Web (Entertainment)",
    region: "US",
    url: "http://www.blackamericaweb.com/rss/BAW/Entertainment.xml",
    tags: ["entertainment"],
  }, // :contentReference[oaicite:8]{index=8}
  {
    id: "rollingout",
    name: "Rolling Out",
    region: "US",
    url: "https://rollingout.com/feed/",
    tags: ["entertainment"],
  }, // :contentReference[oaicite:9]{index=9}
  {
    id: "bossip",
    name: "Bossip",
    region: "US",
    url: "https://feeds.feedburner.com/bossiprss",
    tags: ["entertainment"],
  }, // :contentReference[oaicite:10]{index=10}

  // --- Global/Africa ---
  {
    id: "okayafrica",
    name: "OkayAfrica",
    region: "Global",
    url: "https://www.okayafrica.com/feeds/feed.rss",
    tags: ["news", "entertainment"],
  },
  {
    id: "face2faceafrica",
    name: "Face2Face Africa",
    region: "Global",
    url: "https://face2faceafrica.com/feed",
    tags: ["news", "entertainment"],
  }, // :contentReference[oaicite:11]{index=11}

  {
    id: "africanews",
    name: "AfricaNews",
    region: "Africa",
    url: "https://www.africanews.com/feed/rss",
    tags: ["news"],
  },
  {
    id: "allafrica_latest",
    name: "AllAfrica",
    region: "Africa",
    url: "http://allafrica.com/tools/headlines/rdf/latest/headlines.rdf",
    tags: ["news"],
  },
  {
    id: "modernghana_ent",
    name: "ModernGhana (Entertainment)",
    region: "Africa",
    url: "https://rss.modernghana.com/entertainment.xml",
    tags: ["entertainment"],
  }, // :contentReference[oaicite:12]{index=12}

  // --- Optional: BET (many feeds; you can pick specific ones later) ---
  // BET exposes multiple RSS endpoints under /feeds/... :contentReference[oaicite:13]{index=13}
  // { id: "bet_news", name: "BET", region: "US", url: "https://www.bet.com/feeds/news.xml", tags: ["news", "entertainment"] },
];

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const parser = new Parser();

function stripHtml(input: string) {
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function guessImageFromHtml(html?: string) {
  if (!html) return null;
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m?.[1] || null;
}

function normalizeItem(source: Source, item: any): NewsItem | null {
  const title = (item.title || "").trim();
  const url = (item.link || item.guid || "").trim();
  if (!title || !url) return null;

  const publishedAt =
    item.isoDate || item.pubDate || item.published || item.date || undefined;

  const rawSnippet =
    item.contentSnippet ||
    item.summary ||
    item.content ||
    item["content:encoded"] ||
    "";

  const snippet = rawSnippet
    ? stripHtml(String(rawSnippet)).slice(0, 280)
    : undefined;

  const enclosureUrl = item.enclosure?.url ? String(item.enclosure.url) : null;
  const image =
    enclosureUrl ||
    guessImageFromHtml(String(item.content || item["content:encoded"] || "")) ||
    null;

  const id = `${source.id}:${Buffer.from(url).toString("base64").slice(0, 24)}`;

  return {
    id,
    title,
    url,
    source: source.name,
    region: source.region,
    publishedAt,
    snippet,
    image,
    tags: source.tags,
  };
}

async function fetchFeed(source: Source): Promise<NewsItem[]> {
  const res = await fetch(source.url, {
    headers: {
      "User-Agent": "BWE-NewsBot/1.0 (+https://blackwealthexchange.com)",
      Accept:
        "application/rss+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.7",
    },
  });

  if (!res.ok)
    throw new Error(`Feed fetch failed: ${source.id} (${res.status})`);

  const xml = await res.text();
  const feed = await parser.parseString(xml);

  const out: NewsItem[] = [];
  for (const it of feed.items || []) {
    const normalized = normalizeItem(source, it);
    if (normalized) out.push(normalized);
  }
  return out.slice(0, 60);
}

type CacheShape = {
  at: number;
  items: NewsItem[];
  failures: Record<string, string>;
};
function getCache(): CacheShape {
  const g = globalThis as any;
  if (!g.__bweNewsCache) g.__bweNewsCache = { at: 0, items: [], failures: {} };
  return g.__bweNewsCache as CacheShape;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const region =
    typeof req.query.region === "string" ? req.query.region : "all";
  const topic = typeof req.query.topic === "string" ? req.query.topic : "all"; // all | entertainment | business | news
  const limit = Math.max(
    1,
    Math.min(150, parseInt(String(req.query.limit || "50"), 10) || 50),
  );

  res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=300");

  const cache = getCache();
  const now = Date.now();

  // Refresh cache if stale
  if (!cache.items.length || now - cache.at > CACHE_TTL_MS) {
    const failures: Record<string, string> = {};
    const results = await Promise.allSettled(SOURCES.map((s) => fetchFeed(s)));

    const merged: NewsItem[] = [];
    results.forEach((r, idx) => {
      const src = SOURCES[idx];
      if (r.status === "fulfilled") merged.push(...r.value);
      else failures[src.id] = r.reason?.message || "Failed";
    });

    // Deduplicate by URL
    const seen = new Set<string>();
    const deduped = merged.filter((it) => {
      const key = it.url;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort newest first
    deduped.sort((a, b) => {
      const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return tb - ta;
    });

    cache.at = now;
    cache.items = deduped;
    cache.failures = failures;
  }

  // Filter
  let items = cache.items.slice();

  if (region !== "all") items = items.filter((it) => it.region === region);

  if (topic !== "all")
    items = items.filter((it) => (it.tags || []).includes(topic as any));

  if (q) {
    const qq = q.toLowerCase();
    items = items.filter((it) => {
      const hay = `${it.title} ${it.snippet || ""} ${it.source}`.toLowerCase();
      return hay.includes(qq);
    });
  }

  items = items.slice(0, limit);

  res.status(200).json({
    updatedAt: new Date(cache.at).toISOString(),
    ttlSeconds: Math.floor(CACHE_TTL_MS / 1000),
    total: items.length,
    sources: SOURCES.map((s) => ({
      id: s.id,
      name: s.name,
      region: s.region,
      url: s.url,
      tags: s.tags || [],
    })),
    failures: cache.failures,
    items,
  });
}
