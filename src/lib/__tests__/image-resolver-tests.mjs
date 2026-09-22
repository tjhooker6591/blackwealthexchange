import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "../../../");
const tmpDir = path.join(repoRoot, ".tmp");
await fs.mkdir(tmpDir, { recursive: true });

const sourcePath = path.join(repoRoot, "src/lib/imageResolver.ts");
const targetPath = path.join(tmpDir, "imageResolver-testable.mjs");

const source = await fs.readFile(sourcePath, "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;

await fs.writeFile(targetPath, transpiled, "utf8");

const { resolveBusinessImage } = await import(`file://${targetPath}`);

const staleUploadRecord = {
  image: "/uploads/hwhh0zbo60csk4oh4yhpj8fau.png",
  logo: "/uploads/hwhh0zbo60csk4oh4yhpj8fau.png",
  category: "fashion",
};

const staleResolved = resolveBusinessImage(staleUploadRecord);
assert.equal(staleResolved.sourceType, "bwe");
assert.equal(staleResolved.categoryKey, "bwe_default");
assert.equal(staleResolved.url, "/default-image.jpg");

const persistedFallbackRecord = {
  imageFallback: {
    url: "/images/fallback/food.jpg",
    categoryKey: "food",
  },
};

const persistedFallbackResolved = resolveBusinessImage(persistedFallbackRecord);
assert.equal(persistedFallbackResolved.sourceType, "bwe");
assert.equal(persistedFallbackResolved.categoryKey, "bwe_default");
assert.equal(persistedFallbackResolved.url, "/default-image.jpg");

const trustedRemoteRecord = {
  image: "https://res.cloudinary.com/example/image/upload/v1/pamfa.png",
  category: "fashion",
};

const remoteResolved = resolveBusinessImage(trustedRemoteRecord);
assert.equal(remoteResolved.sourceType, "business");
assert.equal(remoteResolved.url, trustedRemoteRecord.image);

console.log("image-resolver-tests: ok");
