// mobile/src/screens/AccountScreen.tsx -- GET /api/auth/me (Bearer)
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useAuth } from "../api/AuthContext";

export default function AccountScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Signed in as</Text>
      <Text style={styles.email}>{user?.email}</Text>
      <Text style={styles.role}>{user?.accountType}</Text>

      <TouchableOpacity style={styles.button} onPress={logout}>
        <Text style={styles.buttonText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 24, paddingTop: 48 },
  label: { color: "#888", fontSize: 12, textTransform: "uppercase" },
  email: { color: "#fff", fontSize: 20, fontWeight: "700", marginTop: 4 },
  role: {
    color: "#D4AF37",
    fontSize: 13,
    marginTop: 4,
    textTransform: "capitalize",
  },
  button: {
    marginTop: 32,
    borderColor: "#f87171",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  buttonText: { color: "#f87171", fontWeight: "700" },
});
