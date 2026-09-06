// mobile/src/screens/DirectoryScreen.tsx -- GET /api/search/businesses
import React, { useState } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { apiRequest } from "../api/client";
import ListScreen from "../components/ListScreen";
import Card from "../components/Card";

type BusinessItem = {
  _id: string;
  business_name?: string;
  name?: string;
  display_categories?: string;
  city?: string;
  state?: string;
};

export default function DirectoryScreen() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<BusinessItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runSearch(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    const result = await apiRequest<{ items: BusinessItem[] }>(
      `/api/search/businesses?search=${encodeURIComponent(q)}&limit=20`,
      { auth: false },
    );
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setItems(result.data.items || []);
  }

  return (
    <ListScreen
      loading={loading}
      error={error}
      data={items}
      emptyLabel="Search for a real Black-owned business."
      keyExtractor={(item) => item._id}
      header={
        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            placeholder="Search businesses…"
            placeholderTextColor="#888"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => runSearch(query)}
            returnKeyType="search"
          />
        </View>
      }
      renderItem={(item) => (
        <Card
          title={item.business_name || item.name || "Business"}
          subtitle={item.display_categories}
          body={[item.city, item.state].filter(Boolean).join(", ")}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  searchRow: { marginBottom: 12 },
  input: {
    backgroundColor: "#111",
    borderColor: "#333",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    color: "#fff",
  },
});
