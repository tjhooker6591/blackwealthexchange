#!/usr/bin/env node
import { execSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const mode = process.argv.includes("--clear") ? "clear" : "check";

function sh(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function listeners(port) {
  const out = sh(`lsof -n -P -iTCP:${port} -sTCP:LISTEN`);
  if (!out) return [];
  return out
    .split("\n")
    .slice(1)
    .filter(Boolean)
    .map((line) => {
      const parts = line.trim().split(/\s+/);
      return { command: parts[0], pid: parts[1], raw: line };
    });
}

function nextProcsForRepo() {
  const out = sh("ps -Ao pid=,command=");
  if (!out) return [];
  return out
    .split("\n")
    .filter(Boolean)
    .map((line) => line.trim())
    .filter((line) => line.includes(repoRoot))
    .filter(
      (line) =>
        /(^|\s|\/)node\b.*(?:\/next(?:\s|$)|next(?:\s|$))/.test(line) ||
        /\bnext\s+(dev|start)\b/.test(line),
    );
}

function httpStatus(url) {
  const res = spawnSync(
    "curl",
    ["-s", "-o", "/dev/null", "-w", "%{http_code}", url],
    { encoding: "utf8" },
  );
  return (res.stdout || "").trim();
}

function httpBody(url) {
  const res = spawnSync("curl", ["-s", url], { encoding: "utf8" });
  return res.stdout || "";
}

function checkArtifacts() {
  const nextDir = path.join(repoRoot, ".next");
  const routesManifest = path.join(nextDir, "routes-manifest.json");
  const prerenderManifest = path.join(nextDir, "prerender-manifest.json");
  const webpackRuntime = path.join(nextDir, "server", "webpack-runtime.js");

  const errors = [];
  if (!existsSync(nextDir)) errors.push("missing .next directory");
  if (!existsSync(routesManifest))
    errors.push("missing .next/routes-manifest.json");
  if (!existsSync(prerenderManifest))
    errors.push("missing .next/prerender-manifest.json");

  if (existsSync(webpackRuntime)) {
    const content = readFileSync(webpackRuntime, "utf8");
    const refs = [...content.matchAll(/\.\/([0-9]+\.js)/g)].map((m) => m[1]);
    const uniq = [...new Set(refs)].slice(0, 50);
    const missing = uniq.filter(
      (f) => !existsSync(path.join(nextDir, "server", f)),
    );
    if (missing.length) {
      errors.push(
        `missing webpack chunk(s): ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? " ..." : ""}`,
      );
    }
  }

  return errors;
}

const p3000 = listeners(3000);
const p3001 = listeners(3001);
const p3002 = listeners(3002);
const nextProcs = nextProcsForRepo();

console.log(`runtime:check (${mode})`);
console.log("--- port listeners ---");
console.log(
  "3000:",
  p3000.length ? p3000.map((x) => `${x.pid}:${x.command}`).join(", ") : "none",
);
console.log(
  "3001:",
  p3001.length ? p3001.map((x) => `${x.pid}:${x.command}`).join(", ") : "none",
);
console.log(
  "3002:",
  p3002.length ? p3002.map((x) => `${x.pid}:${x.command}`).join(", ") : "none",
);
console.log("--- next processes (repo-scoped) ---");
console.log(nextProcs.length ? nextProcs.join("\n") : "none");

let fail = false;

if (mode === "clear") {
  if (p3000.length || p3001.length || p3002.length || nextProcs.length) {
    console.error(
      "FAIL: build precheck requires no Next runtime on 3000/3001/3002 and no repo-scoped Next process.",
    );
    fail = true;
  }
  if (fail) process.exit(1);
  console.log("PASS: runtime clear, safe to run build.");
  process.exit(0);
}

if (p3001.length || p3002.length) {
  console.error("FAIL: forbidden listeners on 3001/3002 detected.");
  fail = true;
}
if (p3000.length !== 1) {
  console.error(
    `FAIL: expected exactly one listener on 3000, found ${p3000.length}.`,
  );
  fail = true;
}
if (nextProcs.length !== 1) {
  console.error(
    `FAIL: expected exactly one repo-scoped Next runtime process, found ${nextProcs.length}.`,
  );
  fail = true;
}

const artifactErrors = checkArtifacts();
if (artifactErrors.length) {
  console.error(
    "FAIL: Runtime artifact state is invalid. Stop dev server, remove .next, restart one runtime on 3000.",
  );
  artifactErrors.forEach((e) => console.error(` - ${e}`));
  fail = true;
}

const homeStatus = httpStatus("http://localhost:3000/");
const homeBody = homeStatus ? httpBody("http://localhost:3000/") : "";
if (homeStatus !== "200") {
  console.error(
    `FAIL: quick smoke check for / returned ${homeStatus || "no response"}, expected 200.`,
  );
  fail = true;
}
if (homeBody.includes("missing required error components")) {
  console.error(
    "FAIL: detected 'missing required error components' shell on / .",
  );
  console.error(
    "Runtime artifact state is invalid. Stop dev server, remove .next, restart one runtime on 3000.",
  );
  fail = true;
}

if (fail) process.exit(1);
console.log(
  "PASS: single-runtime + artifact sanity guardrail satisfied (localhost:3000 only).",
);
