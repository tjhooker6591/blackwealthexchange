const fs = require("fs");
const { execSync } = require("child_process");
const inv = JSON.parse(fs.readFileSync("/tmp/stab_inventory.json", "utf8"));
const apis = [...new Set([...inv.criticalApis, ...inv.adminApis])];
const base = "http://localhost:3000";
function check(path) {
  const cmd = `curl -s -o /tmp/stab_api_body.txt -w '%{http_code}' '${base}${path}'`;
  try {
    const code = execSync(cmd).toString().trim();
    const body = fs
      .readFileSync("/tmp/stab_api_body.txt", "utf8")
      .slice(0, 180)
      .replace(/\n/g, " ");
    return { path, code, body };
  } catch {
    return { path, code: "ERR", body: "" };
  }
}
const out = apis.map(check);
fs.writeFileSync("/tmp/stab_api_results.json", JSON.stringify(out, null, 2));
console.log("done", out.length);
