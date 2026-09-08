// mobile/src/screens/AiModeScreen.tsx -- POST /api/v1/ai/mode
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { apiRequest } from "../api/client";

type AiModeData = { answer: string; answerSource: "ai" | "structured" };

export default function AiModeScreen() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<AiModeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask() {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    const result = await apiRequest<AiModeData>("/api/v1/ai/mode", {
      method: "POST",
      body: { query: query.trim() },
      auth: false,
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setAnswer(result.data);
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16 }}
    >
      <Text style={styles.title}>BWE AI Mode</Text>
      <Text style={styles.subtitle}>
        Ask in plain English -- grounded in real BWE data.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Show products under $50"
        placeholderTextColor="#888"
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={ask}
      />
      <TouchableOpacity style={styles.button} onPress={ask} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.buttonText}>Ask</Text>
        )}
      </TouchableOpacity>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {answer ? (
        <View style={styles.answerBox}>
          <Text style={styles.answerSource}>
            {answer.answerSource === "ai"
              ? "AI-written, grounded"
              : "Structured -- no AI provider configured"}
          </Text>
          <Text style={styles.answerText}>{answer.answer}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  title: { color: "#D4AF37", fontSize: 22, fontWeight: "800" },
  subtitle: { color: "#888", fontSize: 13, marginTop: 4, marginBottom: 16 },
  input: {
    backgroundColor: "#111",
    borderColor: "#333",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    color: "#fff",
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#D4AF37",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  buttonText: { color: "#000", fontWeight: "800" },
  error: { color: "#f87171", marginTop: 12 },
  answerBox: {
    marginTop: 16,
    backgroundColor: "#0f0f0f",
    borderRadius: 16,
    padding: 14,
    borderColor: "#262626",
    borderWidth: 1,
  },
  answerSource: {
    color: "#666",
    fontSize: 10,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  answerText: { color: "#fff", fontSize: 14, lineHeight: 20 },
});
