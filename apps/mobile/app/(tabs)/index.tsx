import { GOALPOST_BRAND } from "@goalpost/ui";
import { StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.brand}>{GOALPOST_BRAND}</Text>
      <Text style={styles.title}>Daily accountability</Text>
      <Text style={styles.subtitle}>
        Connect Supabase env vars, then build auth and post flows. Web app ships
        first — use npm run dev:web from the repo root.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#09090b",
  },
  brand: {
    color: "#34d399",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  title: {
    color: "#fafafa",
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    color: "#a1a1aa",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
});
