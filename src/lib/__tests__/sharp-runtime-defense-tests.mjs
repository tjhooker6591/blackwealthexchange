import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import ts from "typescript";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "../../../");
const tmpDir = path.join(repoRoot, ".tmp/sharp-runtime-defense-tests");
await fs.mkdir(tmpDir, { recursive: true });

async function transpileToTmp(sourceRelativePath, targetFilename) {
  const sourcePath = path.join(repoRoot, sourceRelativePath);
  const targetPath = path.join(tmpDir, targetFilename);
  const source = await fs.readFile(sourcePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  await fs.writeFile(targetPath, transpiled, "utf8");
  return targetPath;
}

await transpileToTmp("src/instrumentation.ts", "instrumentation.mjs");
globalThis.__non_webpack_require__ = createRequire(import.meta.url);
const { register } = await import(
  `file://${path.join(tmpDir, "instrumentation.mjs")}`
);

const gifBuffer = await sharp({
  create: {
    width: 1,
    height: 1,
    channels: 3,
    background: { r: 0, g: 0, b: 0 },
  },
})
  .gif()
  .toBuffer();
const jpegBuffer = await sharp({
  create: {
    width: 1,
    height: 1,
    channels: 3,
    background: { r: 0, g: 0, b: 0 },
  },
})
  .jpeg()
  .toBuffer();
const pngBuffer = await sharp({
  create: {
    width: 1,
    height: 1,
    channels: 3,
    background: { r: 0, g: 0, b: 0 },
  },
})
  .png()
  .toBuffer();
const webpBuffer = await sharp({
  create: {
    width: 1,
    height: 1,
    channels: 3,
    background: { r: 0, g: 0, b: 0 },
  },
})
  .webp()
  .toBuffer();
const tiffBuffer = await sharp({
  create: {
    width: 1,
    height: 1,
    channels: 3,
    background: { r: 0, g: 0, b: 0 },
  },
})
  .tiff()
  .toBuffer();
const vipsPath = path.join(tmpDir, "sample.vips");
await sharp({
  create: {
    width: 1,
    height: 1,
    channels: 3,
    background: { r: 0, g: 0, b: 0 },
  },
}).toFile(vipsPath);

await sharp(gifBuffer).metadata();
await sharp(tiffBuffer).metadata();
await sharp(vipsPath).metadata();

await register();

await sharp(jpegBuffer).metadata();
await sharp(pngBuffer).metadata();
await sharp(webpBuffer).metadata();

await assert.rejects(() => sharp(gifBuffer).metadata());
await assert.rejects(() => sharp(tiffBuffer).metadata());
await assert.rejects(() => sharp(vipsPath).metadata());

console.log("sharp-runtime-defense-tests: ok");
