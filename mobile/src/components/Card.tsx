import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function Card({
  title,
  subtitle,
  body,
}: {
  title: string;
  subtitle?: string | null;
  body?: string | null;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {body ? (
        <Text style={styles.body} numberOfLines={3}>
          {body}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#0f0f0f",
    borderColor: "#262626",
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  title: { color: "#fff", fontWeight: "700", fontSize: 15 },
  subtitle: { color: "#D4AF37", fontSize: 12, marginTop: 2 },
  body: { color: "#999", fontSize: 13, marginTop: 6 },
});
