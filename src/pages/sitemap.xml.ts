import type { GetServerSideProps } from "next";
import clientPromise from "@/lib/mongodb";
import { getBaseUrl } from "@/lib/seo";

type UrlEntry = { loc: string; changefreq?: string; priority?: string };

function buildUrlSet(urls: UrlEntry[]) {
  const body = urls
    .map(
      (u) =>
        `<url><loc>${u.loc}</loc>${u.changefreq ? `<changefreq>${u.changefreq}</changefreq>` : ""}${u.priority ? `<priority>${u.priority}</priority>` : ""}</url>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
}

function slugify(input: string) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// A handful of legacy business records have a corrupted `alias` stored as
// a raw number (a stray coordinate value from a bad geocoding import) and
// no real slug or business_name. Coercing that to a string here used to
// still list it in the sitemap, but /business/[slug]'s lookup does a
// strict-type match against the DB, so a numeric alias can never actually
// resolve -- confirmed 2026-09-12 as a real, live source of dead sitemap
// entries. A bare number/coordinate never a real slug either way.
function looksNumeric(value: string) {
  return /^-?\d+(\.\d+)?$/.test(value);
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const base = getBaseUrl().replace(/\/$/, "");

  const urls: UrlEntry[] = [
    { loc: `${base}/`, changefreq: "daily", priority: "1.0" },
    { loc: `${base}/black-wealth`, changefreq: "weekly", priority: "0.95" },
    {
      loc: `${base}/business-directory`,
      changefreq: "daily",
      priority: "0.95",
    },
    {
      loc: `${base}/black-owned-businesses`,
      changefreq: "weekly",
      priority: "0.85",
    },
    { loc: `${base}/search-results`, changefreq: "daily", priority: "0.8" },
    {
      loc: `${base}/travel-map/explore`,
      changefreq: "daily",
      priority: "0.85",
    },
    { loc: `${base}/wealth-builder`, changefreq: "daily", priority: "0.85" },
    { loc: `${base}/black-card`, changefreq: "weekly", priority: "0.86" },
    {
      loc: `${base}/recruiting-consulting`,
      changefreq: "weekly",
      priority: "0.8",
    },
    {
      loc: `${base}/financial-literacy`,
      changefreq: "weekly",
      priority: "0.75",
    },
    { loc: `${base}/job-listings`, changefreq: "daily", priority: "0.8" },
    { loc: `${base}/marketplace`, changefreq: "daily", priority: "0.8" },
    { loc: `${base}/about`, changefreq: "monthly", priority: "0.6" },
    { loc: `${base}/resources`, changefreq: "weekly", priority: "0.72" },
    {
      loc: `${base}/resources/articles`,
      changefreq: "weekly",
      priority: "0.72",
    },
  ];

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    const [businesses, products, jobs, categories, cityStatePairs] =
      await Promise.all([
        db
          .collection("businesses")
          .find(
            { status: { $nin: ["rejected", "archived"] } },
            { projection: { slug: 1, alias: 1, business_name: 1 } },
          )
          .limit(1000)
          .toArray(),
        db
          .collection("products")
          .find({ status: { $ne: "archived" } }, { projection: { _id: 1 } })
          .limit(1000)
          .toArray(),
        db
          .collection("jobs")
          .find({ status: "approved" }, { projection: { _id: 1 } })
          .limit(1000)
          .toArray(),
        db.collection("businesses").distinct("category"),
        db
          .collection("businesses")
          .aggregate([
            {
              $match: {
                city: { $type: "string", $ne: "" },
                state: { $type: "string", $ne: "" },
              },
            },
            {
              $project: {
                city: { $trim: { input: "$city" } },
                state: { $toUpper: { $trim: { input: "$state" } } },
              },
            },
            {
              $match: {
                city: { $ne: "" },
                state: { $regex: "^[A-Z]{2}$" },
              },
            },
            {
              $group: {
                _id: {
                  city: { $toLower: "$city" },
                  state: "$state",
                },
                count: { $sum: 1 },
              },
            },
            { $match: { count: { $gte: 3 } } },
            { $sort: { count: -1 } },
            { $limit: 120 },
          ])
          .toArray(),
      ]);

    for (const b of businesses) {
      const rawSlug =
        (typeof b?.slug === "string" && b.slug.trim()) ||
        (typeof b?.alias === "string" && b.alias.trim()) ||
        "";
      const name =
        typeof b?.business_name === "string" ? b.business_name.trim() : "";
      const slug =
        rawSlug || (name && !looksNumeric(name) ? slugify(name) : "");
      if (!slug || looksNumeric(slug)) continue;
      urls.push({
        loc: `${base}/business/${encodeURIComponent(slug)}`,
        changefreq: "weekly",
        priority: "0.7",
      });
    }

    for (const p of products) {
      const id = String(p?._id || "");
      if (!id) continue;
      urls.push({
        loc: `${base}/marketplace/product/${encodeURIComponent(id)}`,
        changefreq: "weekly",
        priority: "0.7",
      });
    }

    for (const j of jobs) {
      const id = String(j?._id || "");
      if (!id) continue;
      urls.push({
        loc: `${base}/job/${encodeURIComponent(id)}`,
        changefreq: "daily",
        priority: "0.75",
      });
    }

    for (const c of categories.slice(0, 100)) {
      const cat = slugify(String(c || ""));
      if (!cat) continue;
      urls.push({
        loc: `${base}/black-owned-businesses/category/${encodeURIComponent(cat)}`,
        changefreq: "weekly",
        priority: "0.68",
      });
    }

    for (const row of cityStatePairs) {
      const city = slugify(String(row?._id?.city || ""));
      const state = slugify(String(row?._id?.state || "")).slice(0, 2);
      if (!city || !state) continue;
      urls.push({
        loc: `${base}/black-owned-businesses/city/${encodeURIComponent(`${city}-${state}`)}`,
        changefreq: "weekly",
        priority: "0.66",
      });
    }
  } catch {
    // keep base sitemap available even if dynamic collections fail
  }

  res.setHeader("Content-Type", "application/xml");
  res.write(buildUrlSet(urls));
  res.end();

  return { props: {} };
};

export default function SiteMapXml() {
  return null;
}
