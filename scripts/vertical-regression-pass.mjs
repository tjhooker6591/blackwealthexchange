const base = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000";

const checks = [
  ["GET", "/marketplace"],
  ["GET", "/marketplace/add-products"],
  ["GET", "/advertise-with-us"],
  ["GET", "/advertising"],
  ["GET", "/job-listings"],
  ["GET", "/employer/jobs"],
  ["GET", "/admin/dashboard"],
  ["GET", "/business-directory"],
  ["GET", "/api/searchBusinesses?query=food&limit=3"],
  ["GET", "/api/searchOrganizations?query=church&limit=3"],
];

let failed = false;
for (const [method, path] of checks) {
  const res = await fetch(`${base}${path}`, { method, redirect: "manual" });
  const ok = [200, 302, 307, 308].includes(res.status);
  console.log(`${ok ? "OK" : "FAIL"} ${method} ${path} -> ${res.status}`);
  if (!ok) failed = true;
}
if (failed) process.exit(1);
