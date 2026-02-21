// src/lib/pulse/index.ts
export type Region = "US" | "Africa" | "Global";

export type PulseVibe =
  | "Sonic"
  | "Cinematic"
  | "Iconic"
  | "Diaspora"
  | "DeepDive"
  | "Hype";

export type FeedItem = {
  id: string;
  title: string;
  url: string;
  source: string;
  region: Region;
  publishedAt?: string;
  snippet?: string;
  image?: string | null;
};

export type PulseArc = {
  last24h: number;
  last3d: number;
  last7d: number;
};

export type PulseMoment = {
  id: string;
  title: string;
  vibe: PulseVibe[];
  regionBlend: Region[];
  heat: number; // 0-100
  arc: PulseArc;
  sources: string[];
  heroImage?: string | null;
  updatedAt?: string;
  takeaway: string; // 1-line pulse takeaway
  items: FeedItem[]; // clustered source items
};

const STOP = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "to",
  "of",
  "in",
  "on",
  "for",
  "with",
  "from",
  "by",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "it",
  "this",
  "that",
  "as",
  "at",
  "into",
  "over",
  "after",
  "before",
  "new",
  "latest",
  "watch",
  "video",
  "says",
  "say",
  "said",
  "today",
]);

function safeTime(iso?: string) {
  const t = iso ? new Date(iso).getTime() : 0;
  return Number.isFinite(t) ? t : 0;
}

function stripHtml(s: string) {
  return String(s || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(s: string) {
  return stripHtml(s)
    .replace(/[^\w\s#'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(s: string) {
  const parts = normalizeText(s).toLowerCase().split(" ").filter(Boolean);
  return parts
    .map((p) => p.replace(/^['-]+|['-]+$/g, ""))
    .filter((p) => p.length >= 3 && !STOP.has(p));
}

// lightweight entity extraction (good enough for clustering + Moment titles)
function extractEntities(s: string) {
  const text = normalizeText(s);
  const out = new Set<string>();

  const re = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const v = m[1].trim();
    if (v.length >= 3 && !STOP.has(v.toLowerCase())) out.add(v);
  }

  const hash = /#([A-Za-z0-9_]{3,})/g;
  while ((m = hash.exec(text))) out.add(`#${m[1]}`);

  return Array.from(out).slice(0, 12);
}

function jaccard(a: Set<string>, b: Set<string>) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
}

function buildFingerprint(it: FeedItem) {
  const toks = tokenize(`${it.title} ${it.snippet || ""}`).slice(0, 60);
  const ents = extractEntities(`${it.title} ${it.snippet || ""}`).map((e) =>
    e.toLowerCase(),
  );
  return { tok: new Set(toks), ent: new Set(ents) };
}

function similarity(
  a: ReturnType<typeof buildFingerprint>,
  b: ReturnType<typeof buildFingerprint>,
) {
  const tokSim = jaccard(a.tok, b.tok);
  const entSim = jaccard(a.ent, b.ent);
  return tokSim * 0.7 + entSim * 0.3;
}

function arcCounts(items: FeedItem[], now = Date.now()): PulseArc {
  const ms24 = 24 * 60 * 60 * 1000;
  const ms3d = 3 * ms24;
  const ms7d = 7 * ms24;

  let last24h = 0,
    last3d = 0,
    last7d = 0;
  for (const it of items) {
    const t = safeTime(it.publishedAt);
    if (!t) continue;
    const dt = now - t;
    if (dt <= ms24) last24h++;
    if (dt <= ms3d) last3d++;
    if (dt <= ms7d) last7d++;
  }
  return { last24h, last3d, last7d };
}

function heatScore(items: FeedItem[], now = Date.now()) {
  const newestT = safeTime(items[0]?.publishedAt);
  const hours = newestT ? Math.max(0, (now - newestT) / (1000 * 60 * 60)) : 72;

  const recency = Math.round(60 * Math.exp(-hours / 24)); // 0–60
  const diversity = Math.min(20, new Set(items.map((x) => x.source)).size * 4); // 0–20
  const arc = arcCounts(items, now);
  const velocity = Math.min(20, arc.last24h * 6 + arc.last3d * 2); // 0–20

  return Math.max(0, Math.min(100, recency + diversity + velocity));
}

function tagVibes(items: FeedItem[]): PulseVibe[] {
  const text =
    `${items.map((x) => x.title).join(" ")} ${items.map((x) => x.snippet || "").join(" ")}`.toLowerCase();

  const vibes: PulseVibe[] = [];
  if (
    /music|album|song|tour|concert|rapper|hip[- ]?hop|r&b|dj|producer|billboard|grammy/.test(
      text,
    )
  )
    vibes.push("Sonic");
  if (
    /film|movie|trailer|premiere|box office|director|actor|actress|tv|series|streaming|netflix|hbo|disney|cast/.test(
      text,
    )
  )
    vibes.push("Cinematic");
  if (/legend|icon|iconic|lifetime|honor|award|tribute|milestone/.test(text))
    vibes.push("Iconic");
  if (
    /diaspora|africa|caribbean|global|worldwide|heritage|pan[- ]?african/.test(
      text,
    )
  )
    vibes.push("Diaspora");
  if (
    /explained|breakdown|investigation|why|how|history|analysis|deep dive/.test(
      text,
    )
  )
    vibes.push("DeepDive");
  if (/viral|trend|drama|beef|clapback|internet|tiktok|twitter/.test(text))
    vibes.push("Hype");

  if (!vibes.length) vibes.push("Cinematic");
  return Array.from(new Set(vibes)).slice(0, 3);
}

function pickTitle(items: FeedItem[]) {
  const entCount = new Map<string, number>();
  for (const it of items) {
    for (const e of extractEntities(it.title))
      entCount.set(e, (entCount.get(e) || 0) + 1);
  }
  const topEnt = [...entCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  return topEnt ? `${topEnt} — The Moment` : items[0]?.title || "Pulse Moment";
}

function pickTakeaway(items: FeedItem[]) {
  const s = (items[0]?.snippet || "").trim();
  if (s) return s.length > 140 ? s.slice(0, 137) + "…" : s;
  return "A culture shift is forming across multiple sources.";
}

export function buildPulseMoments(feedItems: FeedItem[]) {
  const items = [...feedItems].sort(
    (a, b) => safeTime(b.publishedAt) - safeTime(a.publishedAt),
  );

  const clusters: Array<{
    fp: ReturnType<typeof buildFingerprint>;
    items: FeedItem[];
  }> = [];
  const MAX_PER_CLUSTER = 7;
  const THRESH = 0.22;

  for (const it of items) {
    const fp = buildFingerprint(it);

    let bestIdx = -1;
    let bestSim = 0;

    for (let i = 0; i < clusters.length; i++) {
      if (clusters[i].items.length >= MAX_PER_CLUSTER) continue;
      const sim = similarity(fp, clusters[i].fp);
      if (sim > bestSim) {
        bestSim = sim;
        bestIdx = i;
      }
    }

    if (bestIdx >= 0 && bestSim >= THRESH) {
      clusters[bestIdx].items.push(it);
      for (const t of fp.tok) clusters[bestIdx].fp.tok.add(t);
      for (const e of fp.ent) clusters[bestIdx].fp.ent.add(e);
    } else {
      clusters.push({ fp, items: [it] });
    }
  }

  return clusters
    .map((c, idx) => {
      const sorted = [...c.items].sort(
        (a, b) => safeTime(b.publishedAt) - safeTime(a.publishedAt),
      );
      const sources = Array.from(new Set(sorted.map((x) => x.source)));
      const regionBlend = Array.from(
        new Set(sorted.map((x) => x.region)),
      ) as Region[];
      const heroImage = sorted.find((x) => x.image)?.image || null;
      const arc = arcCounts(sorted);

      const id = `moment_${idx}_${Buffer.from(sorted[0]?.url || String(idx))
        .toString("base64")
        .slice(0, 10)}`;

      return {
        id,
        title: pickTitle(sorted),
        vibe: tagVibes(sorted),
        regionBlend,
        heat: heatScore(sorted),
        arc,
        sources,
        heroImage,
        updatedAt: sorted[0]?.publishedAt,
        takeaway: pickTakeaway(sorted),
        items: sorted,
      };
    })
    .sort((a, b) => b.heat - a.heat);
}
