import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function DeviceInfo({ navigation }) {
  const sensors = [
    {
      name: "GSR Sensor",
      icon: "pulse",
      status: "Active",
      color: "green",
    },
    {
      name: "EEG Sensor",
      icon: "brain",
      status: "Active",
      color: "green",
    },
    {
      name: "Accelerometer",
      icon: "axis-arrow",
      status: "Active",
      color: "green",
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Device Info</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Device Health */}
        <Text style={styles.sectionTitle}>Device Health</Text>
        <View style={styles.healthGrid}>
          <View style={styles.healthCard}>
            <Text style={styles.healthLabel}>Battery</Text>
            <Text style={styles.healthValue}>85%</Text>
          </View>
          <View style={styles.healthCard}>
            <Text style={styles.healthLabel}>Connection</Text>
            <Text style={[styles.healthValue, { color: "green" }]}>
              Connected
            </Text>
          </View>
          <View style={styles.healthCard}>
            <Text style={styles.healthLabel}>Last Sync</Text>
            <Text style={styles.healthValue}>2 hours ago</Text>
          </View>
        </View>

        {/* Sensors */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
          Sensors
        </Text>

        <View style={styles.sensorsGrid}>
          {sensors.map((sensor) => (
            <View key={sensor.name} style={styles.sensorCard}>
              <MaterialCommunityIcons
                name={sensor.icon}
                size={32}
                color="#13a4ec"
              />
              <Text style={styles.sensorName}>{sensor.name}</Text>
              <Text style={{ color: sensor.color, fontSize: 12 }}>
                {sensor.status}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f7f8" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#f6f7f8",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e2e2",
    paddingTop: 48,
  },

  headerTitle: { fontSize: 18, fontWeight: "bold" },

  scrollContainer: { padding: 16, paddingBottom: 60 },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 12,
  },

  healthGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },

  healthCard: {
    width: "32%",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },

  healthLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#111",
  },

  healthValue: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },

  sensorsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  sensorCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
  },

  sensorName: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 8,
    color: "#111",
    textAlign: "center",
  },
});
