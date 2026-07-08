export type InventoryField = "stock" | "inventory" | "none";

export type MarketplaceInventoryResolution = {
  quantity: number;
  authoritativeField: InventoryField;
  hasConflictingDualFields: boolean;
  purchasable: boolean;
  stockValue: number | null;
  inventoryValue: number | null;
};

function toValidQuantity(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 ? Math.floor(value) : null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (!/^(?:0|[1-9]\d*)(?:\.0+)?$/.test(trimmed)) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : null;
  }

  return null;
}

export function resolveMarketplaceInventory(
  product: Record<string, any> | null | undefined,
): MarketplaceInventoryResolution {
  const stockValue = toValidQuantity(product?.stock);
  const inventoryValue = toValidQuantity(product?.inventory);

  const hasStock = stockValue !== null;
  const hasInventory = inventoryValue !== null;

  const authoritativeField: InventoryField = hasStock
    ? "stock"
    : hasInventory
      ? "inventory"
      : "none";

  const quantity =
    authoritativeField === "stock"
      ? stockValue || 0
      : authoritativeField === "inventory"
        ? inventoryValue || 0
        : 0;

  return {
    quantity,
    authoritativeField,
    hasConflictingDualFields:
      hasStock && hasInventory && stockValue !== inventoryValue,
    purchasable: quantity > 0,
    stockValue,
    inventoryValue,
  };
}

export function buildMarketplaceInventoryDecrementUpdate(
  resolution: MarketplaceInventoryResolution,
): { $inc: { stock: number } } | { $inc: { inventory: number } } | null {
  if (resolution.authoritativeField === "stock") {
    return { $inc: { stock: -1 } };
  }

  if (resolution.authoritativeField === "inventory") {
    return { $inc: { inventory: -1 } };
  }

  return null;
}
