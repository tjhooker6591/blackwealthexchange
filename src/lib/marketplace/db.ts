import { getAppEnv, requireEnv } from "@/lib/env";

export const CANONICAL_MARKETPLACE_DB = "bwes-cluster";

export function getMarketplaceDbName(): string {
  const dbName = requireEnv("MONGODB_DB");
  const appEnv = getAppEnv();

  if (appEnv === "local" && dbName !== CANONICAL_MARKETPLACE_DB) {
    const message =
      `[marketplace-db] Invalid local DB configuration: ` +
      `MONGODB_DB=${dbName}. Expected ${CANONICAL_MARKETPLACE_DB}.`;
    console.error(message);
    throw new Error(message);
  }

  return dbName;
}
