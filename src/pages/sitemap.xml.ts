import type { GetServerSideProps } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { getBaseUrl } from "@/lib/seo";
import { JOB_NICHES, TOP_CITIES, TOP_STATES, toSlug } from "@/lib/seoLanding";

type UrlRow = {
  loc: string;
  lastmod?: string;
  changefreq?: "daily" | "weekly" | "monthly";
  priority?: string;
};

function esc(v: string) {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const base = getBaseUrl().replace(/\/$/, "");
  const rows: UrlRow[] = [
    { loc: `${base}/`, changefreq: "daily", priority: "1.0" },
    {
      loc: `${base}/business-directory`,
      changefreq: "daily",
      priority: "0.95",
    },
    {
      loc: `${base}/black-owned-businesses`,
      changefreq: "daily",
      priority: "0.95",
    },
    { loc: `${base}/marketplace`, changefreq: "daily", priority: "0.95" },
    {
      loc: `${base}/shop-black-owned-products`,
      changefreq: "daily",
      priority: "0.9",
    },
    { loc: `${base}/job-listings`, changefreq: "daily", priority: "0.9" },
    { loc: `${base}/black-jobs`, changefreq: "daily", priority: "0.9" },
    { loc: `${base}/jobs`, changefreq: "weekly", priority: "0.85" },
    {
      loc: `${base}/financial-literacy`,
      changefreq: "weekly",
      priority: "0.85",
    },
    {
      loc: `${base}/financial-literacy-for-black-communities`,
      changefreq: "weekly",
      priority: "0.85",
    },
    {
      loc: `${base}/wealth-building-resources`,
      changefreq: "weekly",
      priority: "0.85",
    },
    { loc: `${base}/resources`, changefreq: "weekly", priority: "0.8" },
  ];

  for (const city of TOP_CITIES) {
    rows.push({
      loc: `${base}/black-owned-businesses/${toSlug(city)}`,
      changefreq: "weekly",
      priority: "0.8",
    });
  }

  for (const state of TOP_STATES) {
    rows.push({
      loc: `${base}/black-owned-business-directory/${state.toLowerCase()}`,
      changefreq: "weekly",
      priority: "0.75",
    });
  }

  for (const niche of JOB_NICHES) {
    rows.push({
      loc: `${base}/black-jobs/${niche}`,
      changefreq: "weekly",
      priority: "0.75",
    });
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    const businesses = await db
      .collection("businesses")
      .find(
        {
          $or: [
            { status: "approved" },
            { status: { $exists: false } },
            { status: "" },
            { status: null },
          ],
        },
        { projection: { alias: 1, updatedAt: 1, createdAt: 1 } },
      )
      .sort({ updatedAt: -1 })
      .limit(5000)
      .toArray();

    for (const b of businesses) {
      const alias = typeof b.alias === "string" ? b.alias.trim() : "";
      if (!alias) continue;
      rows.push({
        loc: `${base}/business-directory/${encodeURIComponent(alias)}`,
        lastmod: new Date(
          b.updatedAt || b.createdAt || Date.now(),
        ).toISOString(),
        changefreq: "weekly",
        priority: "0.8",
      });
    }

    const products = await db
      .collection("products")
      .find(
        { status: "active", isPublished: true },
        { projection: { _id: 1, updatedAt: 1, createdAt: 1 } },
      )
      .sort({ updatedAt: -1 })
      .limit(5000)
      .toArray();

    for (const p of products) {
      rows.push({
        loc: `${base}/marketplace/product/${encodeURIComponent(String(p._id))}`,
        lastmod: new Date(
          p.updatedAt || p.createdAt || Date.now(),
        ).toISOString(),
        changefreq: "weekly",
        priority: "0.75",
      });
    }
  } catch (err) {
    console.error("sitemap generation failed", err);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows
    .map(
      (row) =>
        `  <url>\n    <loc>${esc(row.loc)}</loc>${row.lastmod ? `\n    <lastmod>${esc(row.lastmod)}</lastmod>` : ""}${row.changefreq ? `\n    <changefreq>${row.changefreq}</changefreq>` : ""}${row.priority ? `\n    <priority>${row.priority}</priority>` : ""}\n  </url>`,
    )
    .join("\n")}\n</urlset>`;

  res.setHeader("Content-Type", "application/xml");
  res.write(xml);
  res.end();

  return { props: {} };
};

export default function SitemapXml() {
  return null;
}
