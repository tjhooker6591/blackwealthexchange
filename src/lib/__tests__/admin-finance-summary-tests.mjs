import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "../../../");
const tmpDir = path.join(repoRoot, ".tmp");
await fs.mkdir(tmpDir, { recursive: true });

const sourcePath = path.join(repoRoot, "src/lib/adminFinanceSummary.ts");
const targetPath = path.join(tmpDir, "adminFinanceSummary-testable.mjs");

const source = await fs.readFile(sourcePath, "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;

await fs.writeFile(
  targetPath,
  transpiled.replace(
    'from "@/lib/finance/ledger";',
    'from "../src/lib/finance/ledger.ts";',
  ),
  "utf8",
);

process.env.ENABLE_FINANCIAL_LEDGER = "false";

const { getAdminFinanceSummary, streamForPayment } = await import(
  `file://${targetPath}`
);

class MockCursor {
  constructor(docs) {
    this.docs = docs;
  }

  sort() {
    return this;
  }

  limit() {
    return this;
  }

  async toArray() {
    return this.docs;
  }
}

class MockCollection {
  constructor(name, docs = []) {
    this.name = name;
    this.docs = docs;
  }

  find() {
    return new MockCursor(this.docs);
  }

  aggregate() {
    return new MockCursor([]);
  }
}

class MockDb {
  constructor(collections) {
    this.collections = collections;
  }

  collection(name) {
    return this.collections[name] || new MockCollection(name, []);
  }
}

const mockDb = new MockDb({
  payments: new MockCollection("payments", [
    {
      type: "ad",
      metadata: { itemId: "directory-featured" },
      amountCents: 3000,
      bweFee: 1200,
      payout: 1800,
      status: "paid",
      paidAt: "2026-08-02T12:00:00.000Z",
      updatedAt: "2026-08-02T12:00:00.000Z",
    },
    {
      type: "ad",
      metadata: { itemId: "directory-featured" },
      amountCents: 5000,
      bweFee: 2000,
      payout: 3000,
      status: "pending",
      updatedAt: "2026-08-02T13:00:00.000Z",
    },
    {
      type: "product",
      itemId: "prod_123",
      amountCents: 1000,
      bweFee: 400,
      payout: 600,
      status: "refunded",
      paidAt: "2026-08-01T12:00:00.000Z",
      updatedAt: "2026-08-01T12:00:00.000Z",
    },
  ]),
  affiliatePayouts: new MockCollection("affiliatePayouts", []),
});

const summary = await getAdminFinanceSummary(mockDb);

assert.equal(summary.sourceOfTruth, "payments");
assert.equal(summary.totalRevenue, 1200);
assert.equal(summary.pendingRevenue, 5000);
assert.equal(summary.failedOrRefunded, 1000);
assert.equal(summary.byStream.directory.count, 2);
assert.equal(summary.byStream.directory.completed, 3000);
assert.equal(summary.byStream.directory.pending, 5000);
assert.equal(summary.monthlySummary["2026-08"], 1200);
assert.equal(Object.keys(summary.monthlySummary).length, 1);
assert.equal(streamForPayment("ad", "directory-standard"), "directory");
assert.equal(streamForPayment("product", "anything"), "marketplace");

console.log("admin-finance-summary-tests: ok");
