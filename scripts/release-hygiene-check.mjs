import { execSync } from "node:child_process";

function run(cmd) {
  return execSync(cmd, { encoding: "utf8" }).trim();
}

try {
  const status = run("git status --porcelain");
  const dirty = status.split("\n").filter(Boolean);

  if (dirty.length) {
    console.error("Release hygiene check failed: working tree not clean.");
    console.error(dirty.join("\n"));
    process.exit(1);
  }

  console.log("Release hygiene check passed: working tree clean.");
} catch (err) {
  console.error("Release hygiene check failed:", err.message);
  process.exit(1);
}
