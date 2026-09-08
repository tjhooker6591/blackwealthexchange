// mobile/src/screens/BusinessManagementScreen.tsx -- Phase 7 Mobile
// Business Management. GET /api/user/managed-businesses (Bearer, real
// verified-ownership check server-side, same as web) +
// POST /api/business/updates (Phase 5, same ownership gate, notifies
// real followers).
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { apiRequest } from "../api/client";
import ListScreen from "../components/ListScreen";
import Card from "../components/Card";

type ManagedBusiness = {
  id: string;
  displayName: string;
  primaryCategory?: string;
};

export default function BusinessManagementScreen() {
  const [businesses, setBusinesses] = useState<ManagedBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const result = await apiRequest<{ businesses: ManagedBusiness[] }>(
        "/api/user/managed-businesses",
      );
      setLoading(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setBusinesses(result.data.businesses || []);
      if (result.data.businesses?.[0])
        setSelectedId(result.data.businesses[0].id);
    })();
  }, []);

  async function postUpdate() {
    if (!selectedId || !title.trim() || !body.trim()) return;
    setStatus(null);
    const result = await apiRequest<{ followersNotified: number }>(
      "/api/business/updates",
      {
        method: "POST",
        body: {
          businessId: selectedId,
          title: title.trim(),
          body: body.trim(),
        },
      },
    );
    if (!result.ok) {
      setStatus(result.error);
      return;
    }
    setStatus(`Posted. ${result.data.followersNotified} follower(s) notified.`);
    setTitle("");
    setBody("");
  }

  return (
    <ListScreen
      loading={loading}
      error={error}
      data={businesses}
      emptyLabel="You don't manage any verified businesses yet."
      keyExtractor={(item) => item.id}
      renderItem={(item) => (
        <TouchableOpacity onPress={() => setSelectedId(item.id)}>
          <Card
            title={`${item.id === selectedId ? "✓ " : ""}${item.displayName}`}
            subtitle={item.primaryCategory}
          />
        </TouchableOpacity>
      )}
      header={
        businesses.length > 0 ? (
          <View style={styles.form}>
            <Text style={styles.label}>Post an update to your followers</Text>
            <TextInput
              style={styles.input}
              placeholder="Update title"
              placeholderTextColor="#888"
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="What's new?"
              placeholderTextColor="#888"
              value={body}
              onChangeText={setBody}
              multiline
            />
            <TouchableOpacity style={styles.button} onPress={postUpdate}>
              <Text style={styles.buttonText}>Post update</Text>
            </TouchableOpacity>
            {status ? <Text style={styles.status}>{status}</Text> : null}
          </View>
        ) : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  form: {
    marginBottom: 16,
    borderBottomColor: "#262626",
    borderBottomWidth: 1,
    paddingBottom: 16,
  },
  label: { color: "#D4AF37", fontWeight: "700", marginBottom: 8 },
  input: {
    backgroundColor: "#111",
    borderColor: "#333",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    color: "#fff",
    marginBottom: 8,
  },
  multiline: { minHeight: 70, textAlignVertical: "top" },
  button: {
    backgroundColor: "#D4AF37",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  buttonText: { color: "#000", fontWeight: "800" },
  status: { color: "#9ca3af", marginTop: 8, fontSize: 12 },
});
