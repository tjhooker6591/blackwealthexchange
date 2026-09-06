// mobile/src/screens/NotificationsScreen.tsx -- GET /api/notifications/list (Bearer)
import React, { useEffect, useState } from "react";
import { apiRequest } from "../api/client";
import ListScreen from "../components/ListScreen";
import Card from "../components/Card";

type Notification = {
  id: string;
  title: string;
  body: string | null;
  read: boolean;
};

export default function NotificationsScreen() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const result = await apiRequest<{ notifications: Notification[] }>(
        "/api/notifications/list",
      );
      setLoading(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setItems(result.data.notifications || []);
    })();
  }, []);

  return (
    <ListScreen
      loading={loading}
      error={error}
      data={items}
      emptyLabel="Nothing yet -- follow a business or save a search to get real updates here."
      keyExtractor={(item) => item.id}
      renderItem={(item) => <Card title={item.title} body={item.body} />}
    />
  );
}
