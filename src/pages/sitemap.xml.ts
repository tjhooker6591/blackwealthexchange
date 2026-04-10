import type { GetServerSideProps } from "next";
import { getBaseUrl } from "@/lib/seo";

type UrlEntry = { loc: string; changefreq?: string; priority?: string };

function buildUrlSet(urls: UrlEntry[]) {
  const body = urls
    .map(
      (u) => `<url><loc>${u.loc}</loc>${u.changefreq ? `<changefreq>${u.changefreq}</changefreq>` : ""}${u.priority ? `<priority>${u.priority}</priority>` : ""}</url>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const base = getBaseUrl().replace(/\/$/, "");

  const urls: UrlEntry[] = [
    { loc: `${base}/`, changefreq: "daily", priority: "1.0" },
    { loc: `${base}/black-wealth`, changefreq: "weekly", priority: "0.95" },
    { loc: `${base}/business-directory`, changefreq: "daily", priority: "0.95" },
    { loc: `${base}/search-results`, changefreq: "daily", priority: "0.8" },
    { loc: `${base}/travel-map/explore`, changefreq: "daily", priority: "0.85" },
    { loc: `${base}/wealth-builder`, changefreq: "daily", priority: "0.85" },
    { loc: `${base}/recruiting-consulting`, changefreq: "weekly", priority: "0.8" },
    { loc: `${base}/financial-literacy`, changefreq: "weekly", priority: "0.75" },
    { loc: `${base}/job-listings`, changefreq: "daily", priority: "0.8" },
    { loc: `${base}/marketplace`, changefreq: "daily", priority: "0.8" },
    { loc: `${base}/about`, changefreq: "monthly", priority: "0.6" },
  ];

  res.setHeader("Content-Type", "application/xml");
  res.write(buildUrlSet(urls));
  res.end();

  return { props: {} };
};

export default function SiteMapXml() {
  return null;
}
