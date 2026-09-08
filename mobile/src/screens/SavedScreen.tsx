// mobile/src/screens/SavedScreen.tsx -- Phase 5 Network Effects on mobile:
// GET /api/business/follow?mine=1 + GET /api/user/save-business (both Bearer)
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { apiRequest } from "../api/client";
import ListScreen from "../components/ListScreen";
import Card from "../components/Card";

type SavedBusiness = {
  businessId: string;
  displayName: string;
  primaryCategory?: string;
};

export default function SavedScreen() {
  const [following, setFollowing] = useState<SavedBusiness[]>([]);
  const [saved, setSaved] = useState<SavedBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [followRes, savedRes] = await Promise.all([
        apiRequest<{ businesses: SavedBusiness[] }>(
          "/api/business/follow?mine=1",
        ),
        apiRequest<{ businesses: SavedBusiness[] }>("/api/user/save-business"),
      ]);
      setLoading(false);
      if (!followRes.ok || !savedRes.ok) {
        setError(!followRes.ok ? followRes.error : (savedRes as any).error);
        return;
      }
      setFollowing(followRes.data.businesses || []);
      setSaved(savedRes.data.businesses || []);
    })();
  }, []);

  const combined = [
    ...following.map((b) => ({ ...b, kind: "Following" })),
    ...saved.map((b) => ({ ...b, kind: "Saved" })),
  ];

  return (
    <ListScreen
      loading={loading}
      error={error}
      data={combined}
      emptyLabel="You haven't followed or saved any businesses yet."
      keyExtractor={(item) => `${item.kind}-${item.businessId}`}
      renderItem={(item) => (
        <View>
          <Text style={styles.kind}>{item.kind}</Text>
          <Card title={item.displayName} subtitle={item.primaryCategory} />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  kind: {
    color: "#D4AF37",
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 2,
    textTransform: "uppercase",
  },
});
