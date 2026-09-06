#!/usr/bin/env node
// scripts/network-alerts-scan.mjs
//
// Phase 5 -- Job Alerts, Scholarship Alerts, Product Alerts. Scans real new
// documents (jobs / studentHubOpportunities / marketplace products) created
// since each saved search's lastAlertedAt, and creates a real notification
// only when a saved search's own query/filters actually match new data.
// Never fabricates a match or a notification. Intended to run on a schedule
// (e.g. daily cron) -- each run is idempotent per saved search because it
// advances lastAlertedAt only after a successful scan.
//
// Usage: node scripts/network-alerts-scan.mjs [--dry-run]

import { MongoClient, ObjectId } from "mongodb";
import fs from "node:fs";

function mongoUri() {
  return (
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    (() => {
      try {
        const t = fs.readFileSync("connect.js", "utf8");
        const m = t.match(/"mongodb\+srv:[^"]+"/);
        return m ? m[0].slice(1, -1) : "";
      } catch {
        return "";
      }
    })()
  );
}

const DRY_RUN = process.argv.includes("--dry-run");

function textMatches(query, haystacks) {
  const needle = String(query || "")
    .trim()
    .toLowerCase();
  if (!needle) return true;
  return haystacks.some((h) =>
    String(h || "")
      .toLowerCase()
      .includes(needle),
  );
}

async function scanJobs(db, searches, now, results) {
  const relevant = searches.filter((s) => s.domain === "jobs");
  if (!relevant.length) return;

  const earliest = relevant.reduce((min, s) => {
    const t = s.lastAlertedAt ? new Date(s.lastAlertedAt).getTime() : 0;
    return Math.min(min, t);
  }, Date.now());

  const candidates = await db
    .collection("jobs")
    .find({
      $or: [
        { createdAt: { $gte: new Date(earliest) } },
        { createdAt: { $gte: new Date(earliest).toISOString() } },
      ],
    })
    .limit(500)
    .toArray();

  for (const search of relevant) {
    const since = search.lastAlertedAt
      ? new Date(search.lastAlertedAt).getTime()
      : new Date(search.createdAt || 0).getTime();
    const filters = search.filters || {};
    const matches = candidates.filter((job) => {
      const createdAt = job.createdAt ? new Date(job.createdAt).getTime() : 0;
      if (createdAt <= since) return false;
      if (
        filters.typeFilter &&
        filters.typeFilter !== "all" &&
        job.type !== filters.typeFilter
      )
        return false;
      if (
        filters.locationFilter &&
        filters.locationFilter !== "all" &&
        job.location !== filters.locationFilter
      )
        return false;
      return textMatches(search.query, [job.title, job.company, job.location]);
    });

    if (matches.length) {
      results.push({
        search,
        count: matches.length,
        title: `${matches.length} new job${matches.length === 1 ? "" : "s"} match "${search.label || search.query}"`,
        body: matches
          .slice(0, 3)
          .map((j) => j.title)
          .join(", "),
        href: "/job-listings",
      });
    }
  }
}

async function scanScholarships(db, searches, now, results) {
  const relevant = searches.filter((s) => s.domain === "scholarships");
  if (!relevant.length) return;

  const earliest = relevant.reduce((min, s) => {
    const t = s.lastAlertedAt
      ? new Date(s.lastAlertedAt).getTime()
      : new Date(s.createdAt || 0).getTime();
    return Math.min(min, t);
  }, Date.now());

  const candidates = await db
    .collection("studentHubOpportunities")
    .find({
      archivedAt: null,
      $or: [
        { createdAt: { $gte: new Date(earliest).toISOString() } },
        { createdAt: { $gte: new Date(earliest) } },
      ],
    })
    .limit(500)
    .toArray();

  for (const search of relevant) {
    const since = search.lastAlertedAt
      ? new Date(search.lastAlertedAt).getTime()
      : new Date(search.createdAt || 0).getTime();
    const matches = candidates.filter((record) => {
      const createdAt = record.createdAt
        ? new Date(record.createdAt).getTime()
        : 0;
      if (createdAt <= since) return false;
      const query =
        search.query && search.query !== "scholarships" ? search.query : "";
      return textMatches(query, [record.title, record.organization]);
    });

    if (matches.length) {
      results.push({
        search,
        count: matches.length,
        title: `${matches.length} new scholarship${matches.length === 1 ? "" : "s"} added`,
        body: matches
          .slice(0, 3)
          .map((r) => r.title)
          .join(", "),
        href: "/black-student-opportunities/scholarships",
      });
    }
  }
}

async function scanProducts(db, marketplaceDb, searches, now, results) {
  const relevant = searches.filter((s) => s.domain === "products");
  if (!relevant.length) return;

  const earliest = relevant.reduce((min, s) => {
    const t = s.lastAlertedAt
      ? new Date(s.lastAlertedAt).getTime()
      : new Date(s.createdAt || 0).getTime();
    return Math.min(min, t);
  }, Date.now());

  const candidates = await marketplaceDb
    .collection("products")
    .find({
      $or: [
        { createdAt: { $gte: new Date(earliest) } },
        { createdAt: { $gte: new Date(earliest).toISOString() } },
      ],
    })
    .limit(500)
    .toArray();

  for (const search of relevant) {
    const since = search.lastAlertedAt
      ? new Date(search.lastAlertedAt).getTime()
      : new Date(search.createdAt || 0).getTime();
    const filters = search.filters || {};
    const matches = candidates.filter((product) => {
      const createdAt = product.createdAt
        ? new Date(product.createdAt).getTime()
        : 0;
      if (createdAt <= since) return false;
      if (
        filters.category &&
        filters.category !== "All" &&
        product.category !== filters.category
      )
        return false;
      return textMatches(search.query, [product.name, product.category]);
    });

    if (matches.length) {
      results.push({
        search,
        count: matches.length,
        title: `${matches.length} new product${matches.length === 1 ? "" : "s"} match "${search.label || search.query}"`,
        body: matches
          .slice(0, 3)
          .map((p) => p.name)
          .join(", "),
        href: "/marketplace",
      });
    }
  }
}

async function main() {
  const uri = mongoUri();
  if (!uri) {
    console.error(
      "No MONGODB_URI available. Set MONGODB_URI or provide connect.js.",
    );
    process.exit(1);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "bwes-cluster");
  const marketplaceDb = db; // canonical marketplace db == bwes-cluster

  const now = new Date();
  const searches = await db
    .collection("saved_searches")
    .find({ alertsEnabled: true })
    .toArray();

  const results = [];
  await scanJobs(db, searches, now, results);
  await scanScholarships(db, searches, now, results);
  await scanProducts(db, marketplaceDb, searches, now, results);

  let created = 0;
  for (const match of results) {
    if (!DRY_RUN) {
      await db.collection("notifications").insertOne({
        userId: match.search.userId,
        type: "alert_match",
        title: match.title,
        body: match.body || null,
        href: match.href,
        meta: { savedSearchId: String(match.search._id), count: match.count },
        read: false,
        createdAt: now,
      });
      await db
        .collection("saved_searches")
        .updateOne(
          { _id: new ObjectId(match.search._id) },
          { $set: { lastAlertedAt: now } },
        );
    }
    created += 1;
    console.log(
      `[alerts] ${DRY_RUN ? "[dry-run] " : ""}user=${match.search.userId} domain=${match.search.domain} -- ${match.title}`,
    );
  }

  console.log(
    `[alerts] scanned ${searches.length} alert-enabled saved searches, ${created} notification(s) ${DRY_RUN ? "would be " : ""}created.`,
  );

  // Phase 7 -- Scale/Observability: record a real run summary so the
  // existing system_health_logs dashboards (src/pages/api/admin/metrics/
  // system-health.ts, src/pages/api/support/status.ts) show this
  // background job actually ran, without a duplicate observability store.
  if (!DRY_RUN) {
    await db.collection("system_health_logs").insertOne({
      component: "network_alerts_scan",
      service: "network_alerts_scan",
      route: null,
      status: "ok",
      httpStatus: null,
      message: `Scanned ${searches.length} alert-enabled saved searches, created ${created} notification(s).`,
      durationMs: Date.now() - now.getTime(),
      meta: { searchesScanned: searches.length, notificationsCreated: created },
      createdAt: new Date(),
    });
  }

  await client.close();
}

main().catch(async (err) => {
  console.error("[network-alerts-scan] failed:", err);
  try {
    const uri = mongoUri();
    if (uri) {
      const client = new MongoClient(uri);
      await client.connect();
      const db = client.db(process.env.MONGODB_DB || "bwes-cluster");
      await db.collection("system_health_logs").insertOne({
        component: "network_alerts_scan",
        service: "network_alerts_scan",
        route: null,
        status: "fail",
        httpStatus: null,
        message: err?.message || String(err),
        createdAt: new Date(),
      });
      await client.close();
    }
  } catch {
    // Observability must never mask the original failure.
  }
  process.exit(1);
});
