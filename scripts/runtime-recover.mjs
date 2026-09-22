#!/usr/bin/env node
import { execSync, spawn } from "node:child_process";

function run(cmd) {
  try {
    execSync(cmd, { stdio: "inherit" });
  } catch {}
}

const root = process.cwd();
run(`pkill -f "${root}/node_modules/.bin/next dev -p 3000"`);
run(`pkill -f "${root}/node_modules/.bin/next dev -p 3001"`);
run(`pkill -f "${root}/node_modules/.bin/next dev -p 3002"`);
run("rm -rf .next");

const child = spawn("npm", ["run", "dev", "--", "-p", "3000"], {
  stdio: "inherit",
});
child.on("exit", (code) => process.exit(code ?? 0));
