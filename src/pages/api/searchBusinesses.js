import { parse } from "url";

function firstString(...values) {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { query } = parse(req.url || "", true);

  const search = firstString(query.search, query.query, query.q);
  const category = firstString(query.category);
  const page = firstString(query.page);
  const limit = firstString(query.limit);
  const includeAllStatuses = firstString(query.includeAllStatuses);
  const type = firstString(query.type).toLowerCase();

  const isOrgType = [
    "org",
    "orgs",
    "organization",
    "organizations",
    "organisation",
  ].includes(type);

  const params = new URLSearchParams();
  if (search) params.set(isOrgType ? "query" : "search", search);
  if (category && !isOrgType) params.set("category", category);
  if (page) params.set("page", page);
  if (limit) params.set("limit", limit);
  if (includeAllStatuses) params.set("includeAllStatuses", includeAllStatuses);

  const canonicalPath = isOrgType
    ? `/api/searchOrganizations?${params.toString()}`
    : `/api/search/businesses?${params.toString()}`;

  // Legacy compatibility shim: keep route alive but canonicalize all behavior.
  res.setHeader("Cache-Control", "no-store");
  return res.redirect(307, canonicalPath);
}
