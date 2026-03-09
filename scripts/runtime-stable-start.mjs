import { execSync } from "node:child_process";

const required = ["MONGODB_URI", "JWT_SECRET", "NEXTAUTH_SECRET", "NEXTAUTH_URL"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing required env for stable start: ${missing.join(", ")}`);
  process.exit(1);
}

try {
  execSync("pkill -9 -f 'next' || true", { stdio: "inherit" });
  execSync("rm -rf .next", { stdio: "inherit" });
  execSync("npm run build", { stdio: "inherit" });
  execSync("npm run start", { stdio: "inherit" });
} catch (err) {
  process.exit(1);
}
