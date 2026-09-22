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

await transpileToTmp("src/lib/studentHub/catalog.ts", "catalog-lifecycle.mjs");
await transpileToTmp(
  "src/lib/studentHub/lifecycle.ts",
  "lifecycle-testable.mjs",
  (code) =>
    code.replace(
      /from "@\/lib\/studentHub\/catalog"/g,
      'from "./catalog-lifecycle.mjs"',
    ),
);

const { deriveStudentHubLifecycle } = await import(
  `file://${path.join(tmpDir, "lifecycle-testable.mjs")}`
);

const now = new Date("2026-08-12T12:00:00.000Z");

const base = {
  id: "sample",
  title: "Sample",
  organization: "Org",
  opportunityType: "scholarship",
  categoryPages: ["hub"],
  description: "desc",
  eligibilitySummary: "eligible",
  eligibilityType: "open_to_all_eligible_students",
  studentLevel: "undergraduate",
  attendanceMode: "any",
  status: "open",
  source: "source",
  sourceUrl: "https://example.com/source",
  applicationUrl: "https://example.com/apply",
  createdAt: "2026-08-12T00:00:00.000Z",
  updatedAt: "2026-08-12T00:00:00.000Z",
  lastVerifiedAt: "2026-08-12",
};

assert.equal(deriveStudentHubLifecycle(base, now).status, "open");
assert.equal(
  deriveStudentHubLifecycle(
    { ...base, opensAt: "2026-08-20", status: "upcoming" },
    now,
  ).status,
  "upcoming",
);
assert.equal(
  deriveStudentHubLifecycle(
    { ...base, deadline: "2026-08-20", status: "open" },
    now,
  ).status,
  "closing_soon",
);
assert.equal(
  deriveStudentHubLifecycle(
    { ...base, deadline: "2026-08-10", status: "open" },
    now,
  ).status,
  "closed",
);
assert.equal(
  deriveStudentHubLifecycle({ ...base, status: "needs_review" }, now).status,
  "needs_review",
);

console.log("student-hub-lifecycle-tests: ok");
