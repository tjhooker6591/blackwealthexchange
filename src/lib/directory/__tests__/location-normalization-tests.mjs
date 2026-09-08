import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "../../../../");
const tmpDir = path.join(repoRoot, ".tmp");
await fs.mkdir(tmpDir, { recursive: true });

const sourcePath = path.join(repoRoot, "src/lib/directoryProfileContract.ts");
const targetPath = path.join(tmpDir, "directoryProfileContract-testable.mjs");

const source = await fs.readFile(sourcePath, "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;

await fs.writeFile(targetPath, transpiled, "utf8");

const { normalizeDirectoryLocationParts } = await import(
  `file://${targetPath}`
);

const normalized = normalizeDirectoryLocationParts({
  address: "3301 Main St",
  city: "3301 college park georgia 30349",
  state: "GEORGIA",
  zip: "30349",
  postalCode: "30349",
});

assert.deepEqual(normalized, {
  streetAddress: "3301 Main St",
  addressLine2: "",
  city: "college park",
  state: "GEORGIA",
  postalCode: "30349",
  locality: "college park, GEORGIA",
  localityWithPostal: "college park, GEORGIA 30349",
  fullAddress: "3301 Main St, college park, GEORGIA 30349",
});

console.log("location-normalization-tests: ok");
