const base = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000";
const seeds = ["/", "/business-directory", "/recruiting-consulting"];

const visited = new Set();
const queue = [...seeds];
const broken = [];
const checked = [];

function extractLinks(html) {
  const links = new Set();
  const re = /href="([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) {
    const href = m[1];
    if (!href) continue;
    if (
      href.startsWith("http://") ||
      href.startsWith("https://") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("#")
    )
      continue;
    if (!href.startsWith("/")) continue;
    if (href.startsWith("/_next") || href.startsWith("/api/")) continue;
    links.add(href.split("#")[0]);
  }
  return [...links];
}

while (queue.length && checked.length < 250) {
  const path = queue.shift();
  if (visited.has(path)) continue;
  visited.add(path);

  const res = await fetch(`${base}${path}`, { redirect: "manual" });
  checked.push({ path, status: res.status });

  if (![200, 301, 302, 307, 308].includes(res.status)) {
    broken.push({ path, status: res.status });
    continue;
  }

  if (res.status !== 200) continue;
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("text/html")) continue;

  const html = await res.text();
  const links = extractLinks(html);
  for (const l of links) {
    if (!visited.has(l)) queue.push(l);
  }
}

console.log(JSON.stringify({ base, checked: checked.length, broken }, null, 2));
if (broken.length) process.exit(1);
