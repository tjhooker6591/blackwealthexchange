// src/components/CheckoutSummary.tsx

import React from 'react';
import { calculateShipping, CartItem } from '../lib/shipping';

interface CheckoutSummaryProps {
  items: CartItem[];
}

const CheckoutSummary: React.FC<CheckoutSummaryProps> = ({ items }) => {
  // Calculate costs in cents
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = calculateShipping(items);
  const total = subtotal + shipping;

  return (
    <div className="p-4 bg-black text-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-2">Order Summary</h3>
      <div className="space-y-1 mb-4">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>${(subtotal / 100).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping:</span>
          <span>${(shipping / 100).toFixed(2)}</span>
        </div>
      </div>
      <div className="flex justify-between font-bold text-xl">
        <span>Total:</span>
        <span>${(total / 100).toFixed(2)}</span>
      </div>
    </div>
  );
};

export default CheckoutSummary;
