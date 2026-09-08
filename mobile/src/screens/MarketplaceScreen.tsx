// mobile/src/screens/MarketplaceScreen.tsx -- GET /api/marketplace/get-products
import React, { useEffect, useState } from "react";
import { apiRequest } from "../api/client";
import ListScreen from "../components/ListScreen";
import Card from "../components/Card";

type Product = {
  _id: string;
  name: string;
  price?: number;
  category?: string;
  description?: string;
};

export default function MarketplaceScreen() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const result = await apiRequest<{ products: Product[] }>(
        "/api/marketplace/get-products?limit=20",
        {
          auth: false,
        },
      );
      setLoading(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setItems(result.data.products || []);
    })();
  }, []);

  return (
    <ListScreen
      loading={loading}
      error={error}
      data={items}
      emptyLabel="No products available right now."
      keyExtractor={(item) => item._id}
      renderItem={(item) => (
        <Card
          title={item.name}
          subtitle={
            typeof item.price === "number"
              ? `$${item.price.toFixed(2)}`
              : undefined
          }
          body={item.description}
        />
      )}
    />
  );
}
