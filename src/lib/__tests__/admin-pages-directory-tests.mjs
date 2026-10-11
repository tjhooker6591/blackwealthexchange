import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "../../../");
const adminDir = path.join(repoRoot, "src/pages/admin");

async function listPages(dir, prefix = "/admin") {
  const pages = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      pages.push(
        ...(await listPages(
          path.join(dir, entry.name),
          `${prefix}/${entry.name}`,
        )),
      );
    } else if (entry.name.endsWith(".tsx") && !entry.name.startsWith("[")) {
      const name = entry.name.replace(/\.tsx$/, "");
      pages.push(name === "index" ? prefix : `${prefix}/${name}`);
    }
  }
  return pages;
}

const source = await fs.readFile(
  path.join(repoRoot, "src/lib/adminPages.ts"),
  "utf8",
);
const listed = [...source.matchAll(/href:\s*"([^"]+)"/g)].map((m) => m[1]);

// The dashboard hosts the directory, and claim-approvals only redirects to
// claim-verification, so neither needs its own entry.
const exempt = new Set(["/admin/dashboard", "/admin/claim-approvals"]);
const pages = (await listPages(adminDir)).filter((page) => !exempt.has(page));

assert.deepEqual(
  pages.filter((page) => !listed.includes(page)).sort(),
  [],
  "admin pages missing from src/lib/adminPages.ts",
);
assert.deepEqual(
  listed.filter((href) => !pages.includes(href)).sort(),
  [],
  "src/lib/adminPages.ts lists pages that do not exist",
);
assert.equal(new Set(listed).size, listed.length, "duplicate admin page link");

console.log("admin-pages-directory-tests: all passed");
