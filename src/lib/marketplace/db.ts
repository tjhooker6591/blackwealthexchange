import { getAppEnv, getMongoDbName } from "@/lib/env";

export const CANONICAL_MARKETPLACE_DB = "bwes-cluster";

export function getMarketplaceDbName(): string {
  const appEnv = getAppEnv();
  const dbName = getMongoDbName(CANONICAL_MARKETPLACE_DB);

  if (appEnv === "local" && dbName !== CANONICAL_MARKETPLACE_DB) {
    const message =
      `[marketplace-db] Invalid local DB configuration: ` +
      `MONGODB_DB=${dbName}. Expected ${CANONICAL_MARKETPLACE_DB}.`;
    console.error(message);
    throw new Error(message);
  }

  return dbName;
}
