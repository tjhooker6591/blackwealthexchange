#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const cwd = process.cwd();
const envLocal = path.join(cwd, ".env.local");
const nvmrc = path.join(cwd, ".nvmrc");

const checks = [];

function addCheck(name, pass, detail, severity = "info") {
  checks.push({ name, pass, detail, severity });
}

function parseMajor(v) {
  const m = String(v).match(/v?(\d+)/);
  return m ? Number(m[1]) : null;
}

const nodeMajor = parseMajor(process.version);
addCheck(
  "Node major version",
  nodeMajor === 22,
  `running ${process.version}; recommended v22.x`,
  nodeMajor === 22 ? "info" : "warn",
);

addCheck(".env.local presence", fs.existsSync(envLocal), ".env.local file", "warn");
addCheck(".nvmrc presence", fs.existsSync(nvmrc), ".nvmrc file", "info");
addCheck(
  "package-lock.json presence",
  fs.existsSync(path.join(cwd, "package-lock.json")),
  "lockfile for reproducible installs",
  "warn",
);

let portInfo = "not listening";
let portPass = false;
try {
  const out = execSync("lsof -iTCP:3000 -sTCP:LISTEN -n -P", {
    stdio: ["ignore", "pipe", "ignore"],
  })
    .toString()
    .trim();
  if (out) {
    portInfo = out.split("\n").slice(0, 2).join(" | ");
    portPass = true;
  }
} catch {
  // not listening
}
addCheck("localhost:3000 listener", portPass, portInfo, "warn");

const nextDir = path.join(cwd, ".next");
if (fs.existsSync(nextDir)) {
  addCheck(
    ".next directory",
    true,
    "present (ok). If you hit unexplained 500s, clear manually: rm -rf .next",
    "info",
  );
} else {
  addCheck(".next directory", true, "absent (normal before first build/dev)", "info");
}

console.log("\nLocal preflight (detect-only)");
for (const c of checks) {
  const icon = c.pass ? "✅" : c.severity === "warn" ? "⚠️" : "❌";
  console.log(`${icon} ${c.name}: ${c.detail}`);
}

const hardFailures = checks.filter((c) => !c.pass && c.severity === "error");
if (hardFailures.length) process.exit(1);
