import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  ScrollView,
} from "react-native";
import { AuthContext } from "../../AuthContext";

export default function LoginScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const { login } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (!email || !password) {
      alert("Please enter Login ID and Password");
      return;
    }
    login(email, password);
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: isDark ? "#101c22" : "#f6f7f8" },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? "#fff" : "#111" }]}>
          NeuroNest
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          autoCapitalize="none"
          placeholderTextColor={isDark ? "#617c89" : "#a0b3bd"}
          style={[
            styles.input,
            {
              backgroundColor: isDark ? "#1a2a33" : "#f0f3f4",
              color: isDark ? "#fff" : "#111",
            },
          ]}
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          placeholderTextColor={isDark ? "#617c89" : "#a0b3bd"}
          style={[
            styles.input,
            {
              backgroundColor: isDark ? "#1a2a33" : "#f0f3f4",
              color: isDark ? "#fff" : "#111",
            },
          ]}
        />
      </View>

      <TouchableOpacity
        style={[styles.loginButton, { backgroundColor: "#13a4ec" }]}
        onPress={handleLogin}
      >
        <Text style={styles.loginButtonText}>Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  loginButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
