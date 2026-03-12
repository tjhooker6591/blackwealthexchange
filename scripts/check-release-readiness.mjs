#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const steps = [
  ["check:env:local", ["npm", "run", "-s", "check:env:local"]],
  ["preflight:local", ["npm", "run", "-s", "preflight:local"]],
  ["smoke:local", ["npm", "run", "-s", "smoke:local"]],
  ["check:runtime-health", ["npm", "run", "-s", "check:runtime-health"]],
  ["check:critical-paths", ["npm", "run", "-s", "check:critical-paths"]],
  ["check:p2-regression", ["npm", "run", "-s", "check:p2-regression"]],
  ["check:buy-flows", ["npm", "run", "-s", "check:buy-flows"]],
  ["check:critical-indexes", ["npm", "run", "-s", "check:critical-indexes"]],
  ["check:db-docs", ["npm", "run", "-s", "check:db-docs"]],
  ["check:release-hygiene", ["npm", "run", "-s", "check:release-hygiene"]],
];

let failed = 0;
console.log("\nRelease readiness (detect-only)\n");

for (const [name, cmd] of steps) {
  console.log(`===== ${name} =====`);
  const r = spawnSync(cmd[0], cmd.slice(1), {
    stdio: "inherit",
    env: process.env,
    shell: false,
  });
  const ok = r.status === 0;
  if (!ok) failed += 1;
  console.log(`----- ${name}: ${ok ? "PASS" : "FAIL"} -----\n`);
}

if (failed) {
  console.error(`Release readiness failed: ${failed} step(s).`);
  process.exit(1);
}

console.log("Release readiness checks passed.");
