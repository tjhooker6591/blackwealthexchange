// mobile/src/screens/WalletScreen.tsx -- Phase 7 Mobile Wallet / Black
// Card. GET /api/black-card/member-summary (Bearer, extended in this
// phase) for real tier/status/verification data, rendered as a real
// scannable QR code of the member's real verification URL
// (react-native-qrcode-svg, pure client-side rendering -- no Apple/Google
// Wallet issuer credential needed for this). Apple/Google Wallet PASS
// issuance (a .pkpass / Google Wallet object) is a separate, larger
// integration that needs real issuer credentials BWE does not have
// configured -- see mobile/README.md and the Phase 7 closure report for
// that exact gate. This screen does not claim that integration exists.

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Linking,
  TouchableOpacity,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { apiRequest } from "../api/client";

type MemberSummary = {
  ok: boolean;
  card?: {
    memberId: string;
    status: string;
    cardTierName: string;
    verificationUrl: string | null;
  };
};

export default function WalletScreen() {
  const [summary, setSummary] = useState<MemberSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const result = await apiRequest<MemberSummary>(
        "/api/black-card/member-summary",
      );
      setLoading(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSummary(result.data);
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#D4AF37" />
      </View>
    );
  }

  if (error || !summary?.card) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>
          {error || "No active Black Card membership yet."}
        </Text>
      </View>
    );
  }

  const { card } = summary;

  return (
    <View style={styles.container}>
      <View style={styles.cardBox}>
        <Text style={styles.cardLabel}>BWE Black Card</Text>
        <Text style={styles.cardTier}>{card.cardTierName}</Text>
        <View style={styles.row}>
          <Text style={styles.fieldLabel}>Member ID</Text>
          <Text style={styles.fieldValue}>{card.memberId || "—"}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.fieldLabel}>Status</Text>
          <Text style={[styles.fieldValue, { color: "#4ade80" }]}>
            {card.status}
          </Text>
        </View>
      </View>

      {card.verificationUrl ? (
        <View style={styles.qrBox}>
          <QRCode
            value={card.verificationUrl}
            size={160}
            backgroundColor="#fff"
            color="#000"
          />
          <Text style={styles.qrLabel}>Scan to verify membership</Text>
          <TouchableOpacity
            onPress={() => Linking.openURL(card.verificationUrl!)}
          >
            <Text style={styles.link}>Open verification page</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <Text style={styles.note}>
        Apple Wallet / Google Wallet pass issuance is not yet configured -- it
        needs a real Apple Pass Type ID certificate and/or Google Wallet issuer
        account, which are owner-provided credentials this build does not have.
        This QR code is real and independently verifiable today.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 20,
    alignItems: "center",
  },
  empty: { color: "#888", marginTop: 32 },
  cardBox: {
    width: "100%",
    backgroundColor: "#120d05",
    borderColor: "#D4AF37",
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    marginTop: 24,
  },
  cardLabel: {
    color: "#F0D789",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  cardTier: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 4,
    marginBottom: 12,
  },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  fieldLabel: { color: "#999" },
  fieldValue: { color: "#fff", fontWeight: "600" },
  qrBox: { marginTop: 24, alignItems: "center" },
  qrLabel: { color: "#888", fontSize: 12, marginTop: 10 },
  link: { color: "#D4AF37", marginTop: 8, fontWeight: "700" },
  note: {
    color: "#666",
    fontSize: 11,
    marginTop: 28,
    textAlign: "center",
    lineHeight: 16,
  },
});
