#!/usr/bin/env node
import { execSync } from 'node:child_process';

function sh(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

function listeners(port) {
  const out = sh(`lsof -n -P -iTCP:${port} -sTCP:LISTEN`);
  if (!out) return [];
  const lines = out.split('\n').slice(1).filter(Boolean);
  return lines.map((line) => {
    const parts = line.trim().split(/\s+/);
    return { command: parts[0], pid: parts[1], raw: line };
  });
}

const p3000 = listeners(3000);
const p3001 = listeners(3001);
const p3002 = listeners(3002);
const nextProcs = sh('ps -Ao pid,command | grep -E "next dev|next start|node.*next" | grep -v grep')
  .split('\n')
  .filter(Boolean);

console.log('runtime:check');
console.log('--- port listeners ---');
console.log('3000:', p3000.length ? p3000.map(x => `${x.pid}:${x.command}`).join(', ') : 'none');
console.log('3001:', p3001.length ? p3001.map(x => `${x.pid}:${x.command}`).join(', ') : 'none');
console.log('3002:', p3002.length ? p3002.map(x => `${x.pid}:${x.command}`).join(', ') : 'none');
console.log('--- next processes ---');
console.log(nextProcs.length ? nextProcs.join('\n') : 'none');

let fail = false;
if (p3001.length || p3002.length) {
  console.error('FAIL: forbidden listeners on 3001/3002 detected.');
  fail = true;
}
if (p3000.length !== 1) {
  console.error(`FAIL: expected exactly one listener on 3000, found ${p3000.length}.`);
  fail = true;
}
if (nextProcs.length > 1) {
  console.error(`FAIL: expected at most one Next runtime process, found ${nextProcs.length}.`);
  fail = true;
}

if (fail) process.exit(1);
console.log('PASS: single-runtime guardrail satisfied (localhost:3000 only).');