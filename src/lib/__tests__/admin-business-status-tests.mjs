import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "../../../");
const tmpDir = path.join(repoRoot, ".tmp");
await fs.mkdir(tmpDir, { recursive: true });

const sourcePath = path.join(repoRoot, "src/lib/adminBusinessStatus.ts");
const targetPath = path.join(tmpDir, "adminBusinessStatus-testable.mjs");

const source = await fs.readFile(sourcePath, "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;

await fs.writeFile(targetPath, transpiled, "utf8");

const { deriveAdminBusinessStatus, getAdminBusinessBucketFilter } =
  await import(`file://${targetPath}`);

assert.equal(
  deriveAdminBusinessStatus({ status: "duplicate_pending_review" }),
  "duplicate_review",
);
assert.equal(
  deriveAdminBusinessStatus({ status: "pending_review" }),
  "pending",
);
assert.equal(
  deriveAdminBusinessStatus({ status: "active", approved: true }),
  "approved",
);

const duplicateFilter = getAdminBusinessBucketFilter("duplicate_review");
assert.deepEqual(duplicateFilter.$or[0], {
  status: { $in: ["duplicate_pending_review"] },
});

console.log("admin-business-status-tests: ok");
