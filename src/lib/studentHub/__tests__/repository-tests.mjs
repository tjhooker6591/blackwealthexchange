import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "../../../../");
const tmpDir = path.join(repoRoot, ".tmp/student-hub-tests");
await fs.mkdir(tmpDir, { recursive: true });

async function transpileToTmp(sourceRelativePath, targetFilename, replacer) {
  const sourcePath = path.join(repoRoot, sourceRelativePath);
  const targetPath = path.join(tmpDir, targetFilename);
  const source = await fs.readFile(sourcePath, "utf8");
  let transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;

  if (replacer) {
    transpiled = replacer(transpiled);
  }

  await fs.writeFile(targetPath, transpiled, "utf8");
  return targetPath;
}

await transpileToTmp("src/lib/studentHub/catalog.ts", "catalog-testable.mjs");
await transpileToTmp(
  "src/lib/studentHub/repository.ts",
  "repository-testable.mjs",
  (code) =>
    code
      .replace(
        /import clientPromise from "@\/lib\/mongodb";/,
        'const clientPromise = { then() { throw new Error("disabled in tests"); }, catch() { throw new Error("disabled in tests"); } };',
      )
      .replace(
        /from "@\/lib\/studentHub\/catalog"/g,
        'from "./catalog-testable.mjs"',
      ),
);

const {
  STUDENT_HUB_COLLECTION,
  createStudentHubRecord,
  updateStudentHubRecord,
  archiveStudentHubRecord,
  markStudentHubRecordVerified,
  getStudentHubResolvedCatalog,
} = await import(`file://${path.join(tmpDir, "repository-testable.mjs")}`);

class FakeCollection {
  constructor(docs = []) {
    this.docs = docs;
  }

  async countDocuments(query = {}) {
    return this.docs.filter((doc) => matches(doc, query)).length;
  }

  find(query = {}) {
    return {
      toArray: async () => this.docs.filter((doc) => matches(doc, query)),
    };
  }

  async insertMany(docs) {
    this.docs.push(...docs.map((doc) => structuredClone(doc)));
    return { insertedCount: docs.length };
  }

  async insertOne(doc) {
    this.docs.push(structuredClone(doc));
    return { insertedId: doc.id };
  }

  async findOne(query = {}) {
    return this.docs.find((doc) => matches(doc, query)) || null;
  }

  async updateOne(filter = {}, update = {}) {
    const index = this.docs.findIndex((doc) => matches(doc, filter));
    if (index === -1) return { matchedCount: 0, modifiedCount: 0 };
    const next = update.$set
      ? { ...this.docs[index], ...update.$set }
      : this.docs[index];
    this.docs[index] = structuredClone(next);
    return { matchedCount: 1, modifiedCount: 1 };
  }
}

class FakeDb {
  constructor() {
    this.collections = new Map();
  }

  collection(name) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new FakeCollection());
    }
    return this.collections.get(name);
  }
}

function matches(doc, query) {
  return Object.entries(query).every(([key, value]) => doc[key] === value);
}

const db = new FakeDb();

const baseline = await getStudentHubResolvedCatalog({ db });
assert.equal(baseline.storage.mode, "baseline_catalog");
assert.equal(baseline.records.length, 23);

const created = await createStudentHubRecord(
  db,
  {
    title: "Test Opportunity",
    organization: "Test Org",
    opportunityType: "scholarship",
    categoryPages: ["hub", "scholarships"],
    description: "Local test record",
    eligibilitySummary: "Test eligibility",
    eligibilityType: "open_to_all_eligible_students",
    studentLevel: "undergraduate",
    attendanceMode: "any",
    source: "Test source",
    sourceUrl: "https://example.com/source",
    applicationUrl: "https://example.com/apply",
    status: "open",
  },
  "admin@example.com",
);

assert.ok(created.id);

const seeded = await getStudentHubResolvedCatalog({ db });
assert.equal(seeded.storage.mode, "database");
assert.equal(seeded.storage.collection, STUDENT_HUB_COLLECTION);
assert.equal(seeded.records.length, 24);

const updated = await updateStudentHubRecord(
  db,
  created.id,
  {
    sourceUrl: "https://example.com/new-source",
    applicationUrl: "https://example.com/new-apply",
    deadline: "2026-12-31",
    source: "Updated source",
  },
  "admin@example.com",
);

assert.equal(updated.sourceUrl, "https://example.com/new-source");
assert.equal(updated.applicationUrl, "https://example.com/new-apply");
assert.equal(updated.deadline, "2026-12-31");

const verified = await markStudentHubRecordVerified(
  db,
  created.id,
  "admin@example.com",
);
assert.equal(verified.sourceVerified, true);
assert.equal(verified.applicationUrlVerified, true);
assert.ok(verified.lastVerifiedAt);

const archived = await archiveStudentHubRecord(
  db,
  created.id,
  "admin@example.com",
);
assert.equal(archived.status, "closed");
assert.ok(archived.archivedAt);

const afterArchive = await getStudentHubResolvedCatalog({
  db,
  includeArchived: true,
});
const stored = afterArchive.records.find((record) => record.id === created.id);
assert.ok(stored);
assert.equal(stored.source, "Updated source");
assert.equal(stored.status, "closed");

console.log("student-hub-repository-tests: ok");
