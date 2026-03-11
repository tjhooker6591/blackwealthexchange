import { execSync } from "node:child_process";
import fs from "node:fs";

function run(cmd) {
  return execSync(cmd, { encoding: "utf8" }).trim();
}

const requiredDocs = [
  "docs/BWE_MASTER_STATUS.md",
  "docs/BWE_MASTER_TASK_LIST.md",
  "docs/BWE_GROWTH_MASTER_PLAN.md",
  "docs/BWE_DB_CHANGE_SYSTEM.md",
  "docs/BWE_ENV_AND_PROMOTION_SYSTEM.md",
  "docs/BWE_AGENT_OPERATING_RULES.md",
  "docs/BWE_NEXT_SESSION_START.md",
  "docs/MONGODB_CHANGELOG.md",
  "docs/DB_SCHEMA_REGISTER.md",
  "docs/DB_MIGRATIONS.md",
  "docs/DB_ENV_MATRIX.md",
  "docs/DB_CHANGE_PROCESS.md",
];

try {
  const status = run("git status --porcelain");
  const dirty = status.split("\n").filter(Boolean);

  if (dirty.length) {
    console.error("Release hygiene check failed: working tree not clean.");
    console.error(dirty.join("\n"));
    process.exit(1);
  }

  const missing = requiredDocs.filter((p) => !fs.existsSync(p));
  if (missing.length) {
    console.error("Release hygiene check failed: required docs missing.");
    console.error(missing.join("\n"));
    process.exit(1);
  }

  console.log("Release hygiene check passed: working tree clean.");
  console.log("Release hygiene check passed: required docs present.");
} catch (err) {
  console.error("Release hygiene check failed:", err.message);
  process.exit(1);
}
