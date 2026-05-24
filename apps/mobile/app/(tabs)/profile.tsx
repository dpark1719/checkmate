import { apiFetch } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function ProfileScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");

  useEffect(() => {
    apiFetch("/api/users/me")
      .then((r) => r.json())
      .then((d) => {
        setName(d.profile?.displayName ?? "");
        setUsername(d.profile?.username ?? "");
      });
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/(auth)/login");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.username}>@{username}</Text>
      <Pressable style={styles.outline} onPress={signOut}>
        <Text style={styles.outlineText}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#09090b",
    padding: 24,
    gap: 8,
  },
  name: { color: "#fafafa", fontSize: 28, fontWeight: "700" },
  username: { color: "#71717a", marginBottom: 24 },
  outline: {
    borderColor: "#3f3f46",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 16,
  },
  outlineText: { color: "#fafafa" },
});
