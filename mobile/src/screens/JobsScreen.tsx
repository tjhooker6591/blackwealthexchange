// mobile/src/screens/JobsScreen.tsx -- GET /api/jobs/list
import React, { useEffect, useState } from "react";
import { apiRequest } from "../api/client";
import ListScreen from "../components/ListScreen";
import Card from "../components/Card";

type Job = { _id: string; title: string; company?: string; location?: string };

export default function JobsScreen() {
  const [items, setItems] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const result = await apiRequest<{ jobs: Job[] }>(
        "/api/jobs/list?limit=20",
        { auth: false },
      );
      setLoading(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setItems(result.data.jobs || []);
    })();
  }, []);

  return (
    <ListScreen
      loading={loading}
      error={error}
      data={items}
      emptyLabel="No open roles right now."
      keyExtractor={(item) => item._id}
      renderItem={(item) => (
        <Card title={item.title} subtitle={item.company} body={item.location} />
      )}
    />
  );
}
