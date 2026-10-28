#!/usr/bin/env node
// Every pop-up, drawer and full-screen layer must be able to scroll.
//
// A fixed layer (fixed inset-0, fixed inset-y-0, …) taller than a phone
// screen cannot be scrolled with the page, so anything past the bottom (the
// title, Close, Apply, the last menu items) becomes unreachable. That bug
// shipped twice (job details pop-up, phone menu). This check fails when a
// fixed layer's classes have no overflow-y-auto / overflow-auto.
//
// Not every fixed layer holds content: a dimmed backdrop or a wrapper whose
// inner panel scrolls is fine. Mark those with a comment on the same line or
// the line above:   // overlay-scroll-ok: <why>
//
// Run: node scripts/check-overlay-scroll.mjs
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "..",
);
const SRC = path.join(ROOT, "src");
const FILE = /\.(tsx|jsx)$/;
// A full-height fixed layer: covers the screen, or a full-height side drawer.
const FULL_HEIGHT =
  /\bfixed\b[^"'`]*\b(inset-0|inset-y-0|h-screen|h-full|h-\[100d?vh\])\b|\b(inset-0|inset-y-0|h-screen|h-full)\b[^"'`]*\bfixed\b/;
const SCROLLS = /\boverflow(-y)?-(auto|scroll)\b/;
const DECORATIVE = /\bpointer-events-none\b/;
const EXEMPT = /overlay-scroll-ok/;

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === "__tests__") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (FILE.test(e.name)) out.push(p);
  }
  return out;
}

const problems = [];
for (const file of walk(SRC)) {
  const lines = fs.readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    // Only class strings, not prose that happens to say "fixed".
    for (const m of line.matchAll(/(["'`])([^"'`]*\bfixed\b[^"'`]*)\1/g)) {
      const cls = m[2];
      if (!FULL_HEIGHT.test(cls) || SCROLLS.test(cls) || DECORATIVE.test(cls))
        continue;
      if (EXEMPT.test(line) || EXEMPT.test(lines[i - 1] || "")) continue;
      problems.push(`${path.relative(ROOT, file)}:${i + 1}  "${cls.trim()}"`);
    }
  });
}

if (problems.length) {
  console.error(
    "These full-screen layers can't scroll, so content past the bottom of a phone screen is unreachable:\n",
  );
  for (const p of problems) console.error("  " + p);
  console.error(
    "\nAdd overflow-y-auto (and start the panel at the top, e.g. items-start + my-auto),\nor, for a plain backdrop, add a comment: // overlay-scroll-ok: <why>",
  );
  process.exit(1);
}
console.log("check-overlay-scroll: every full-screen layer can scroll.");
