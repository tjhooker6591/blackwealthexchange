// lib/shipping.ts

/**
 * Represents an item in the shopping cart.
 */
export interface CartItem {
  /** Unique product identifier */
  id: string;
  /** Name of the product */
  name: string;
  /** Price per unit, in cents */
  price: number;
  /** Number of units in cart */
  quantity: number;
  /** Weight per unit, in ounces */
  weightOunces: number;
}

/**
 * Calculates shipping cost based on a flat rate plus per-ounce rate.
 * @param items Array of CartItem
 * @returns Shipping cost in cents
 */
export function calculateShipping(items: CartItem[]): number {
  const flatRate = 500; // $5.00 flat rate (in cents)
  const perOunceRate = 10; // $0.10 per ounce (in cents)
  const totalWeight = items.reduce(
    (sum, item) => sum + item.weightOunces * item.quantity,
    0,
  );
  return flatRate + perOunceRate * totalWeight;
}

/**
 * Example usage in a checkout component:
 *
 * import { calculateShipping, CartItem } from '../lib/shipping';
 *
 * const shippingCost = calculateShipping(cartItems);
 * const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
 * const total = subtotal + shippingCost;
 */
