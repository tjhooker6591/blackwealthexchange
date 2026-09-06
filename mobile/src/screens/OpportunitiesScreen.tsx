// mobile/src/screens/OpportunitiesScreen.tsx -- GET /api/opportunities/latest
import React, { useEffect, useState } from "react";
import { apiRequest } from "../api/client";
import ListScreen from "../components/ListScreen";
import Card from "../components/Card";

type Opportunity = { id: string; title: string; org?: string; note?: string };

export default function OpportunitiesScreen() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const result = await apiRequest<Opportunity[]>(
        "/api/opportunities/latest?limit=20",
        { auth: false },
      );
      setLoading(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setItems(Array.isArray(result.data) ? result.data : []);
    })();
  }, []);

  return (
    <ListScreen
      loading={loading}
      error={error}
      data={items}
      emptyLabel="No student opportunities right now."
      keyExtractor={(item) => item.id}
      renderItem={(item) => (
        <Card title={item.title} subtitle={item.org} body={item.note} />
      )}
    />
  );
}
