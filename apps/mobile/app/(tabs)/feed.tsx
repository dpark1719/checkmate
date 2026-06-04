import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface Post {
  id: string;
  photoUrl: string;
  caption: string | null;
  author: { displayName: string; username: string } | null;
}

export default function FeedScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/api/users/me/feed")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok || d.error) {
          throw new Error(d.error ?? "Could not load feed");
        }
        return d;
      })
      .then((d) => {
        setPosts(d.posts ?? []);
        setError(null);
        setLoading(false);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Could not load feed");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#34d399" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={posts}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        <Text style={styles.empty}>No posts yet. Follow people or join communities.</Text>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.author}>
            {item.author?.displayName ?? "User"} · @{item.author?.username}
          </Text>
          <Image source={{ uri: item.photoUrl }} style={styles.image} />
          {item.caption && <Text style={styles.caption}>{item.caption}</Text>}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: "#09090b" },
  content: { padding: 16, gap: 16 },
  center: { flex: 1, backgroundColor: "#09090b", justifyContent: "center" },
  empty: { color: "#71717a", textAlign: "center", marginTop: 40 },
  error: { color: "#f87171", textAlign: "center", paddingHorizontal: 24 },
  card: {
    borderColor: "#27272a",
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },
  author: { color: "#fafafa", padding: 12, fontWeight: "600" },
  image: { width: "100%", aspectRatio: 1, backgroundColor: "#18181b" },
  caption: { color: "#d4d4d8", padding: 12 },
});
