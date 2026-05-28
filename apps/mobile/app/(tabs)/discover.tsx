import { GOAL_CATEGORIES } from "@checkmate/shared";
import { apiFetch } from "@/lib/api";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function DiscoverScreen() {
  const [joined, setJoined] = useState<Set<string>>(new Set());

  async function join(category: string) {
    const res = await apiFetch(`/api/communities/${category}/join`, {
      method: "POST",
    });
    if (res.ok) {
      setJoined((prev) => new Set(prev).add(category));
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Communities</Text>
      {GOAL_CATEGORIES.map((cat) => (
        <View key={cat} style={styles.card}>
          <Text style={styles.cat}>{cat}</Text>
          <Pressable
            style={styles.button}
            onPress={() => join(cat)}
            disabled={joined.has(cat)}
          >
            <Text style={styles.buttonText}>
              {joined.has(cat) ? "Joined" : "Join"}
            </Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09090b" },
  content: { padding: 16, gap: 10 },
  title: { color: "#fafafa", fontSize: 24, fontWeight: "700", marginBottom: 8 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderColor: "#27272a",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  cat: { color: "#fafafa", fontSize: 16, textTransform: "capitalize" },
  button: {
    backgroundColor: "#34d39920",
    borderColor: "#34d39950",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  buttonText: { color: "#34d399", fontWeight: "600" },
});
