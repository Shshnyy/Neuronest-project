import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export default function AppInfoScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>App Info</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.text}>
          NeuroNest is designed for children with Autism Spectrum Disorder (ASD)
          to monitor daily activities using a wearable device. The system helps
          caregivers and parents track behavioral and physiological activity
          patterns, enabling better understanding, timely intervention, and
          improved care support.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f7f8" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e2e2",
  },

  headerTitle: { fontSize: 18, fontWeight: "bold" },

  content: {
    padding: 16,
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 12,
  },

  text: {
    fontSize: 14,
    color: "#444",
    lineHeight: 22,
  },
});
