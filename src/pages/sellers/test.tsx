import React from "react";

export default function TestProductButton() {
  const createTestProduct = async () => {
    const res = await fetch("/api/marketplace/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Product",
        description: "A test product for the marketplace",
        price: 49.99,
        category: "Books",
        imageUrl: "/placeholder.png",
        stockQuantity: 10,
        isFeatured: true,
        sellerId: "test_seller",
      }),
    });

    const data = await res.json();
    console.log("Product created:", data);
  };

  return (
    <div className="p-4">
      <button
        onClick={createTestProduct}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        Add Test Product
      </button>
    </div>
  );
}
