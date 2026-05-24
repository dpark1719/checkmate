import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function magicLink() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    setMessage(error?.message ?? "Check your email for the magic link.");
  }

  async function google() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });
    if (error) setMessage(error.message);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>GoalPost</Text>
      <Text style={styles.title}>Sign in</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#71717a"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <Pressable style={styles.button} onPress={magicLink} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#09090b" />
        ) : (
          <Text style={styles.buttonText}>Email magic link</Text>
        )}
      </Pressable>
      <Pressable style={styles.outline} onPress={google}>
        <Text style={styles.outlineText}>Google</Text>
      </Pressable>
      <Pressable onPress={() => router.replace("/(tabs)")}>
        <Text style={styles.skip}>Continue to app (if already signed in)</Text>
      </Pressable>
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#09090b",
    padding: 24,
    justifyContent: "center",
    gap: 12,
  },
  brand: { color: "#34d399", fontWeight: "600", textTransform: "uppercase" },
  title: { color: "#fafafa", fontSize: 28, fontWeight: "700", marginBottom: 8 },
  input: {
    backgroundColor: "#18181b",
    borderColor: "#3f3f46",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    color: "#fafafa",
  },
  button: {
    backgroundColor: "#34d399",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  buttonText: { color: "#09090b", fontWeight: "700" },
  outline: {
    borderColor: "#3f3f46",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  outlineText: { color: "#fafafa" },
  skip: { color: "#71717a", textAlign: "center", marginTop: 16 },
  message: { color: "#34d399", textAlign: "center", marginTop: 8 },
});
