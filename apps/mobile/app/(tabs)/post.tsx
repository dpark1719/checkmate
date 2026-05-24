import { apiFetch } from "@/lib/api";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface Challenge {
  id: string;
  goalId: string;
  postedAt: string | null;
  goals?: { title: string };
}

export default function PostScreen() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  function load() {
    apiFetch("/api/challenges/today")
      .then((r) => r.json())
      .then((d) => {
        setChallenges(d.challenges ?? []);
        setLoading(false);
      });
  }

  useEffect(() => {
    load();
  }, []);

  async function postPhoto(challenge: Challenge) {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: true,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploading(challenge.id);
    const uri = result.assets[0].uri;
    const form = new FormData();
    form.append("file", {
      uri,
      name: "photo.jpg",
      type: "image/jpeg",
    } as unknown as Blob);

    const uploadRes = await apiFetch("/api/upload", {
      method: "POST",
      body: form,
    });
    const uploadData = await uploadRes.json();
    if (!uploadRes.ok) {
      setUploading(null);
      return;
    }

    await apiFetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        goalId: challenge.goalId,
        dailyChallengeId: challenge.id,
        photoUrl: uploadData.path,
      }),
    });

    setUploading(null);
    load();
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#34d399" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Today&apos;s post</Text>
      {challenges.map((c) => (
        <View key={c.id} style={styles.card}>
          <Text style={styles.goal}>{c.goals?.title ?? "Goal"}</Text>
          {c.postedAt ? (
            <Text style={styles.done}>Posted ✓</Text>
          ) : (
            <Pressable
              style={styles.button}
              onPress={() => postPhoto(c)}
              disabled={uploading === c.id}
            >
              {uploading === c.id ? (
                <ActivityIndicator color="#09090b" />
              ) : (
                <Text style={styles.buttonText}>Take photo & post</Text>
              )}
            </Pressable>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09090b" },
  content: { padding: 16, gap: 12 },
  center: { flex: 1, backgroundColor: "#09090b", justifyContent: "center" },
  title: { color: "#fafafa", fontSize: 24, fontWeight: "700", marginBottom: 8 },
  card: {
    borderColor: "#27272a",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  goal: { color: "#fafafa", fontSize: 16, fontWeight: "600" },
  done: { color: "#34d399" },
  button: {
    backgroundColor: "#34d399",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  buttonText: { color: "#09090b", fontWeight: "700" },
});
