// mobile/src/components/ListScreen.tsx
//
// Shared list-screen shell (loading/error/empty states + FlatList) so
// every data screen doesn't re-implement the same boilerplate.

import React from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";

export default function ListScreen<T>({
  loading,
  error,
  data,
  emptyLabel,
  keyExtractor,
  renderItem,
  header,
}: {
  loading: boolean;
  error: string | null;
  data: T[];
  emptyLabel: string;
  keyExtractor: (item: T) => string;
  renderItem: (item: T) => React.ReactElement;
  header?: React.ReactElement;
}) {
  return (
    <View style={styles.container}>
      {header}
      {loading ? (
        <ActivityIndicator color="#D4AF37" style={{ marginTop: 24 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : data.length === 0 ? (
        <Text style={styles.empty}>{emptyLabel}</Text>
      ) : (
        <FlatList
          data={data}
          keyExtractor={keyExtractor}
          renderItem={({ item }) => renderItem(item)}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 16 },
  error: { color: "#f87171", marginTop: 16 },
  empty: { color: "#888", marginTop: 16 },
});
