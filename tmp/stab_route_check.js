const fs = require("fs");
const { execSync } = require("child_process");
const inv = JSON.parse(fs.readFileSync("/tmp/stab_inventory.json", "utf8"));
const base = "http://localhost:3000";
function check(path) {
  const cmd = `curl -s -o /dev/null -w '%{http_code}' '${base}${path}'`;
  try {
    return execSync(cmd).toString().trim();
  } catch {
    return "ERR";
  }
}
const groups = [
  "publicCore",
  "commercialTrust",
  "coursesGating",
  "accountOps",
  "adminRoutes",
];
const out = {};
for (const g of groups) {
  out[g] = inv[g].map((p) => ({ path: p, code: check(p) }));
}
fs.writeFileSync("/tmp/stab_routes_results.json", JSON.stringify(out, null, 2));
console.log("done");
