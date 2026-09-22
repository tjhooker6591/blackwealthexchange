import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "../../../");
const tmpDir = path.join(repoRoot, ".tmp");
await fs.mkdir(tmpDir, { recursive: true });

async function transpileFile({ sourcePath, targetPath, replacements = [] }) {
  let source = await fs.readFile(sourcePath, "utf8");
  for (const [from, to] of replacements) {
    source = source.replace(from, to);
  }
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  await fs.writeFile(targetPath, transpiled, "utf8");
}

await transpileFile({
  sourcePath: path.join(repoRoot, "src/lib/activity360.ts"),
  targetPath: path.join(tmpDir, "activity360-economicActivity360-testable.mjs"),
});

await transpileFile({
  sourcePath: path.join(repoRoot, "src/lib/economicActivity360.ts"),
  targetPath: path.join(tmpDir, "economicActivity360-testable.mjs"),
  replacements: [
    [
      'from "./activity360";',
      'from "./activity360-economicActivity360-testable.mjs";',
    ],
  ],
});

const { resolveBusinessEconomicActivity360, resolvePersonEconomicActivity360 } =
  await import(
    `file://${path.join(tmpDir, "economicActivity360-testable.mjs")}`
  );

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

class MockCursor {
  constructor(docs) {
    this.docs = docs;
  }

  sort(sortSpec = {}) {
    const [[key, direction]] = Object.entries(sortSpec);
    this.docs.sort((left, right) => {
      const a = left[key];
      const b = right[key];
      if (a > b) return direction === -1 ? -1 : 1;
      if (a < b) return direction === -1 ? 1 : -1;
      return 0;
    });
    return this;
  }

  limit(count) {
    this.docs = this.docs.slice(0, count);
    return this;
  }

  async toArray() {
    return clone(this.docs);
  }
}

class MockCollection {
  constructor(docs = []) {
    this.docs = docs.map((doc) => clone(doc));
  }

  find(filter = {}) {
    const keys = Object.keys(filter);
    const rows = this.docs.filter((doc) =>
      keys.every((key) => String(doc[key]) === String(filter[key])),
    );
    return new MockCursor(rows);
  }
}

class MockDb {
  constructor(fixtures) {
    this.collections = new Map(
      Object.entries(fixtures).map(([name, docs]) => [
        name,
        new MockCollection(docs),
      ]),
    );
  }

  collection(name) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new MockCollection([]));
    }
    return this.collections.get(name);
  }
}

async function testBusinessWithVerifiedRevenue() {
  const db = new MockDb({
    bmev_records: [
      {
        businessId: "biz-1",
        buyerUserId: "user-1",
        source: "marketplace",
        businessLine: "marketplace_product_sale",
        bmevAmountCents: 1500,
        paymentVerified: true,
        occurredAt: new Date("2026-08-01T00:00:00.000Z"),
      },
      {
        businessId: "biz-1",
        buyerUserId: "user-2",
        source: "marketplace",
        businessLine: "marketplace_product_sale",
        bmevAmountCents: 2500,
        paymentVerified: true,
        occurredAt: new Date("2026-09-01T00:00:00.000Z"),
      },
      {
        businessId: "biz-1",
        buyerUserId: "user-3",
        source: "marketplace",
        businessLine: "marketplace_product_sale",
        bmevAmountCents: 9900,
        paymentVerified: false,
        occurredAt: new Date("2026-09-02T00:00:00.000Z"),
      },
    ],
    flow_events: [],
    search_quality_events: [],
  });

  const tracker = { queryCount: 0 };
  const result = await resolveBusinessEconomicActivity360(db, tracker, {
    businessId: "biz-1",
  });

  assert.equal(result.state, "LINKED");
  assert.equal(result.transactionCount, 2);
  assert.equal(result.verifiedRevenueCents, 4000);
  assert.deepEqual(result.businessLines, ["marketplace_product_sale"]);
  assert.equal(result.latestTransactionAt, "2026-09-01T00:00:00.000Z");
  assert.ok(
    result.provenance.some(
      (entry) =>
        entry.source === "bmev_records.businessId" && entry.authoritative,
    ),
  );
}

async function testBusinessWithNoRecords() {
  const db = new MockDb({
    bmev_records: [],
    flow_events: [],
    search_quality_events: [],
  });

  const tracker = { queryCount: 0 };
  const result = await resolveBusinessEconomicActivity360(db, tracker, {
    businessId: "biz-empty",
  });

  assert.equal(result.state, "NOT_LINKED");
  assert.equal(result.transactionCount, 0);
  assert.equal(result.verifiedRevenueCents, 0);
}

async function testMissingBusinessId() {
  const db = new MockDb({
    bmev_records: [],
    flow_events: [],
    search_quality_events: [],
  });
  const tracker = { queryCount: 0 };
  const result = await resolveBusinessEconomicActivity360(db, tracker, {
    businessId: "",
  });

  assert.equal(result.state, "UNKNOWN");
  assert.equal(
    result.provenance.some((entry) => entry.source === "missing_business_id"),
    true,
  );
}

async function testPersonWithVerifiedRevenue() {
  const db = new MockDb({
    bmev_records: [
      {
        businessId: "biz-1",
        buyerUserId: "user-1",
        source: "marketplace",
        businessLine: "marketplace_product_sale",
        bmevAmountCents: 1200,
        paymentVerified: true,
        occurredAt: new Date("2026-07-01T00:00:00.000Z"),
      },
    ],
    flow_events: [],
    search_quality_events: [],
  });

  const tracker = { queryCount: 0 };
  const result = await resolvePersonEconomicActivity360(db, tracker, {
    userId: "user-1",
  });

  assert.equal(result.state, "LINKED");
  assert.equal(result.transactionCount, 1);
  assert.equal(result.verifiedRevenueCents, 1200);
  assert.ok(
    result.provenance.some(
      (entry) =>
        entry.source === "bmev_records.buyerUserId" && entry.authoritative,
    ),
  );
}

for (const test of [
  testBusinessWithVerifiedRevenue,
  testBusinessWithNoRecords,
  testMissingBusinessId,
  testPersonWithVerifiedRevenue,
]) {
  await test();
}

console.log("economicActivity360-tests: all tests passed");
