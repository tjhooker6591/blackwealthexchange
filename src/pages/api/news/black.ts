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

type FeedFailureSummary = {
  sourceId: string;
  sourceName: string;
  url: string;
  error: string;
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
    url: "https://www.blackamericaweb.com/rss/BAW/Entertainment.xml",
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
    url: "https://www.okayafrica.com/feed/",
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
    url: "https://allafrica.com/tools/headlines/rdf/latest/headlines.rdf",
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
const COLD_START_BUDGET_MS = 8000;
const FEED_TIMEOUT_MS = 5000;
const parser = new Parser({
  timeout: FEED_TIMEOUT_MS,
  customFields: {
    item: ["media:content", "media:thumbnail", "content:encoded", "summary"],
  },
});

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

function toValidDateString(value: unknown) {
  const raw = String(value || "").trim();
  if (!raw) return undefined;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime()) || date.getTime() <= 0) return undefined;
  return date.toISOString();
}

function extractImage(item: any) {
  const mediaContent = item?.["media:content"];
  const mediaThumb = item?.["media:thumbnail"];
  const mediaUrl = Array.isArray(mediaContent)
    ? mediaContent[0]?.$
      ? String(mediaContent[0].$.url || "")
      : String(mediaContent[0]?.url || "")
    : mediaContent?.$
      ? String(mediaContent.$.url || "")
      : String(mediaContent?.url || "");
  const thumbUrl = Array.isArray(mediaThumb)
    ? mediaThumb[0]?.$
      ? String(mediaThumb[0].$.url || "")
      : String(mediaThumb[0]?.url || "")
    : mediaThumb?.$
      ? String(mediaThumb.$.url || "")
      : String(mediaThumb?.url || "");
  return (
    mediaUrl ||
    thumbUrl ||
    (item.enclosure?.url ? String(item.enclosure.url) : "") ||
    guessImageFromHtml(String(item.content || item["content:encoded"] || item.summary || "")) ||
    null
  );
}

function normalizeItem(source: Source, item: any): NewsItem | null {
  const title = (item.title || "").trim();
  const url = (item.link || item.guid || "").trim();
  if (!title || !url) return null;

  const publishedAt = toValidDateString(
    item.isoDate || item.pubDate || item.published || item.updated || item.date,
  );

  const rawSnippet =
    item.contentSnippet ||
    item.summary ||
    item.content ||
    item["content:encoded"] ||
    "";

  const snippet = rawSnippet
    ? stripHtml(String(rawSnippet)).slice(0, 280)
    : undefined;

  const image = extractImage(item);

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
      "User-Agent":
        "Mozilla/5.0 (compatible; BWE-NewsBot/1.0; +https://www.blackwealthexchange.com)",
      Accept:
        "application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.7",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: "https://www.blackwealthexchange.com/news",
      DNT: "1",
    },
    signal: AbortSignal.timeout(FEED_TIMEOUT_MS),
    redirect: "follow",
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

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
  successfulSourceIds: string[];
  failedSources: FeedFailureSummary[];
  refreshing?: boolean;
  refreshPromise?: Promise<void> | null;
};
function getCache(): CacheShape {
  const g = globalThis as any;
  if (!g.__bweNewsCache) {
    g.__bweNewsCache = {
      at: 0,
      items: [],
      failures: {},
      successfulSourceIds: [],
      failedSources: [],
      refreshing: false,
      refreshPromise: null,
    };
  }
  const cache = g.__bweNewsCache as CacheShape;
  cache.failures ||= {};
  cache.successfulSourceIds ||= [];
  cache.failedSources ||= [];
  cache.refreshing ||= false;
  cache.refreshPromise ||= null;
  return cache;
}

async function refreshCache(cache: CacheShape, now: number) {
  if (cache.refreshing && cache.refreshPromise) return cache.refreshPromise;

  cache.refreshing = true;
  cache.refreshPromise = (async () => {
    const failures: Record<string, string> = {};
    const merged: NewsItem[] = [];
    const successfulSourceIds: string[] = [];
    const failedSources: FeedFailureSummary[] = [];

    const results = await Promise.allSettled(
      SOURCES.map(async (src) => ({ src, items: await fetchFeed(src) })),
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        const { src, items } = result.value;
        if (items.length > 0) {
          successfulSourceIds.push(src.id);
          merged.push(...items);
        } else {
          const error = "Feed returned zero valid articles";
          failures[src.id] = error;
          failedSources.push({
            sourceId: src.id,
            sourceName: src.name,
            url: src.url,
            error,
          });
        }
      } else {
        const reason = result.reason as any;
        const message = reason?.message || String(reason) || "Failed";
        const sourceMatch = SOURCES[results.indexOf(result)];
        failures[sourceMatch.id] = message;
        failedSources.push({
          sourceId: sourceMatch.id,
          sourceName: sourceMatch.name,
          url: sourceMatch.url,
          error: message,
        });
      }
    }

    const seen = new Set<string>();
    const deduped = merged.filter((it) => {
      const key = it.url;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    deduped.sort((a, b) => {
      const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return tb - ta;
    });

    cache.at = deduped.length ? now : 0;
    cache.items = deduped;
    cache.failures = failures;
    cache.successfulSourceIds = successfulSourceIds;
    cache.failedSources = failedSources;

    if (!deduped.length) {
      console.error("[news:black] all feeds failed", failedSources);
    }
  })().finally(() => {
    cache.refreshing = false;
    cache.refreshPromise = null;
  });

  return cache.refreshPromise;
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

  // Refresh cache if stale.
  // If we already have cached items, return stale quickly and revalidate in background.
  if (
    !cache.items.length ||
    !cache.successfulSourceIds.length ||
    now - cache.at > CACHE_TTL_MS
  ) {
    if (!cache.items.length) {
      await Promise.race([
        refreshCache(cache, now),
        new Promise<void>((resolve) =>
          setTimeout(resolve, COLD_START_BUDGET_MS),
        ),
      ]);
    } else {
      void refreshCache(cache, now);
    }
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

  const successfulSourceIds = cache.successfulSourceIds.length
    ? cache.successfulSourceIds
    : Array.from(
        new Set(
          cache.items
            .map((item) =>
              SOURCES.find((source) => source.name === item.source)?.id || "",
            )
            .filter(Boolean),
        ),
      );

  const successfulSources = SOURCES.filter((s) =>
    successfulSourceIds.includes(s.id),
  );

  res.status(cache.items.length ? 200 : 502).json({
    updatedAt: cache.at > 0 ? new Date(cache.at).toISOString() : null,
    ttlSeconds: Math.floor(CACHE_TTL_MS / 1000),
    total: items.length,
    successfulFeedCount: successfulSources.length,
    failedFeedCount: Object.keys(cache.failures).length,
    sources: successfulSources.map((s) => ({
      id: s.id,
      name: s.name,
      region: s.region,
      url: s.url,
      tags: s.tags || [],
    })),
    failures: cache.failures,
    failureSummary: cache.failedSources,
    items,
    error: cache.items.length ? undefined : "All news feeds failed",
  });
}
