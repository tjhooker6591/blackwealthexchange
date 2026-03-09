import fs from "node:fs";

const requiredDocs = [
  "docs/MONGODB_CHANGELOG.md",
  "docs/DB_SCHEMA_REGISTER.md",
  "docs/DB_MIGRATIONS.md",
  "docs/DB_ENV_MATRIX.md",
  "docs/DB_CHANGE_PROCESS.md",
];

const requiredTokens = {
  "docs/MONGODB_CHANGELOG.md": [
    "consulting_intake",
    "password_resets",
    "password_reset_rate_limits",
    "alias_approved_unique",
    "organizations",
    "MONGODB_DB",
  ],
  "docs/DB_SCHEMA_REGISTER.md": [
    "VERIFY NEXT",
    "users",
    "sellers",
    "employers",
    "jobs",
    "applicants",
    "products",
    "orders",
    "advertising",
    "consulting_interest",
  ],
  "docs/DB_MIGRATIONS.md": [
    "password_resets",
    "password_reset_rate_limits",
    "consulting_intake",
    "alias_approved_unique",
    "organizations",
    "MONGODB_DB",
  ],
};

let ok = true;

for (const p of requiredDocs) {
  if (!fs.existsSync(p)) {
    console.error(`MISSING ${p}`);
    ok = false;
    continue;
  }
  console.log(`OK ${p}`);

  const content = fs.readFileSync(p, "utf8");
  const checks = requiredTokens[p] || [];
  for (const token of checks) {
    if (!content.includes(token)) {
      console.error(`MISSING_TOKEN ${p} :: ${token}`);
      ok = false;
    } else {
      console.log(`OK_TOKEN ${p} :: ${token}`);
    }
  }
}

if (!ok) process.exit(1);
