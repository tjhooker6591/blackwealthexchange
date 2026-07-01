#!/usr/bin/env node

const baseUrl =
  process.env.BASE_URL || process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000";

const checks = [
  { name: "travel_map_page", path: "/travel-map", expect: [200] },
  {
    name: "travel_map_explore_page",
    path: "/travel-map/explore",
    expect: [200],
  },
  {
    name: "travel_map_search_api",
    path: "/api/travel-map/search?query=coffee",
    expect: [200],
  },
  {
    name: "travel_map_nearby_api",
    path: "/api/travel-map/nearby?lat=34.0522&lng=-118.2437",
    expect: [200],
  },
];

const results = [];

for (const check of checks) {
  const url = `${baseUrl}${check.path}`;
  let status = 0;
  let error = null;
  let bodyShape = null;

  try {
    const res = await fetch(url, { redirect: "manual" });
    status = res.status;

    if (check.path.startsWith("/api/")) {
      try {
        const json = await res.json();
        bodyShape = Array.isArray(json)
          ? "array"
          : json && typeof json === "object"
            ? "object"
            : typeof json;
      } catch {
        bodyShape = "non-json";
      }
    }
  } catch (err) {
    error = String(err?.message || err);
  }

  const pass = check.expect.includes(status);
  results.push({ ...check, url, status, bodyShape, error, pass });
}

const passed = results.filter((r) => r.pass).length;
const summary = {
  baseUrl,
  totals: { total: results.length, passed, failed: results.length - passed },
  results,
};

console.log(JSON.stringify(summary, null, 2));

if (summary.totals.failed > 0) process.exitCode = 1;
