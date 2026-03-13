import type { GetServerSideProps } from "next";
import { getBaseUrl } from "@/lib/seo";

const DISALLOWED = [
  "/api/",
  "/admin",
  "/dashboard",
  "/employer",
  "/marketplace/dashboard",
  "/marketplace/orders",
  "/marketplace/analytics",
  "/marketplace/add-products",
  "/marketplace/edit",
  "/checkout",
  "/payment",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const base = getBaseUrl().replace(/\/$/, "");
  const body = [
    "User-agent: *",
    ...DISALLOWED.map((path) => `Disallow: ${path}`),
    "Allow: /",
    `Sitemap: ${base}/sitemap.xml`,
  ].join("\n");

  res.setHeader("Content-Type", "text/plain");
  res.write(body);
  res.end();

  return { props: {} };
};

export default function RobotsTxt() {
  return null;
}
