function safeStr(v) {
  if (typeof v === "string") return v;
  if (v === null || v === undefined) return "";
  try {
    return String(v);
  } catch {
    return "";
  }
}

export function normalizeScope(v) {
  const t = safeStr(v).toLowerCase().trim();
  if (
    t === "org" ||
    t === "orgs" ||
    t === "organisation" ||
    t === "organization" ||
    t === "organizations"
  ) {
    return "organizations";
  }
  if (t === "business" || t === "biz" || t === "businesses") {
    return "businesses";
  }
  return "businesses";
}

export function normalizeSort(v) {
  const t = safeStr(v).toLowerCase().trim();
  if (t === "newest" || t === "recent") return "newest";
  if (t === "completeness" || t === "complete") return "completeness";
  return "relevance";
}

export function buildHomepageDirectoryQuery({
  q,
  scope,
  sort,
  ai,
  verifiedOnly,
  sponsoredFirst,
  state,
  category,
  limit = 20,
}) {
  const cleanQ = safeStr(q).trim();
  const normalizedScope = normalizeScope(scope);
  const normalizedSort = normalizeSort(sort);

  const query = {
    q: cleanQ,
    search: cleanQ,
    type: normalizedScope,
    scope: normalizedScope,
    tab: normalizedScope,
    limit,
    sort: normalizedSort,
    ai: ai ? "1" : "0",
  };

  if (verifiedOnly) query.verifiedOnly = "1";
  if (sponsoredFirst) query.sponsoredFirst = "1";
  if (state) query.state = safeStr(state).toUpperCase().slice(0, 2);
  if (category) query.category = safeStr(category);

  return query;
}

export function buildDirectoryUrlQuery({
  routerQuery,
  scope,
  input,
  page,
  category,
  sort,
  stateFilter,
  verifiedOnly,
  sponsoredFirst,
  includeIncomplete,
}) {
  const normalizedScope = normalizeScope(scope);
  const normalizedSort = normalizeSort(sort);

  const nextQuery = {
    ...(routerQuery || {}),
    type: normalizedScope,
    scope: normalizedScope,
    tab: normalizedScope,
    search: safeStr(input).trim() || "",
    q: safeStr(input).trim() || "",
    page: String(page),
    sort: normalizedSort,
    state: safeStr(stateFilter).toUpperCase().slice(0, 2),
    verifiedOnly: verifiedOnly ? "1" : "0",
    sponsoredFirst: sponsoredFirst ? "1" : "0",
    includeIncomplete: includeIncomplete ? "1" : "0",
  };

  if (normalizedScope === "businesses") nextQuery.category = category || "All";
  else delete nextQuery.category;

  if (!nextQuery.search) delete nextQuery.search;
  if (!nextQuery.q) delete nextQuery.q;
  if (!nextQuery.page || nextQuery.page === "1") delete nextQuery.page;
  if (nextQuery.category === "All") delete nextQuery.category;
  if (!nextQuery.state) delete nextQuery.state;
  if (!nextQuery.sort || nextQuery.sort === "relevance") delete nextQuery.sort;
  if (nextQuery.verifiedOnly === "0") delete nextQuery.verifiedOnly;
  if (nextQuery.sponsoredFirst === "0") delete nextQuery.sponsoredFirst;
  if (nextQuery.includeIncomplete === "0") delete nextQuery.includeIncomplete;

  return nextQuery;
}
