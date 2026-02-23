import React, { useContext } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { WearableContext, MIND_STATES } from "../context/WearableContext";

export default function HomeScreen({ navigation }) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const {
    isConnected,
    sensorData,
    prediction,
    getStateInfo,
    isModelReady,
  } = useContext(WearableContext);

  const stateInfo = getStateInfo(prediction.state);

  const fingerDetected = sensorData.fingerDetected === true;

  const heartRateDisplay = fingerDetected
    ? `${Math.round(sensorData.heartRate)} bpm`
    : "--";

  const heartRateStatus = fingerDetected
    ? sensorData.heartRate < 60
      ? "Low"
      : sensorData.heartRate > 100
      ? "Elevated"
      : "Normal"
    : isConnected
    ? "Place finger on sensor"
    : "No data";

  const calmScoreDisplay = prediction.calmScore || "--";

  const calmScoreStatus = prediction.calmScore
    ? prediction.calmScore >= 80
      ? "Excellent"
      : prediction.calmScore >= 60
      ? "Good"
      : prediction.calmScore >= 40
      ? "Moderate"
      : "Low"
    : "No data";

  const connectionColor = isConnected ? "#22c55e" : "#ef4444";

  // Motion Sense — classified as NONE, LOW, HIGH
  let motionDisplay = "--";
  let motionColor = "#6b7280";
  let motionIcon = "accessibility";
  if (isConnected) {
    if (sensorData.motion === "HIGH") {
      motionDisplay = "HIGH MOTION DETECTED";
      motionColor = "#ef4444";
      motionIcon = "run-circle";
    } else if (sensorData.motion === "LOW") {
      motionDisplay = "LOW MOTION DETECTED";
      motionColor = "#f59e42";
      motionIcon = "directions-run";
    } else {
      motionDisplay = "No Motion";
      motionColor = "#3b82f6";
      motionIcon = "accessibility";
    }
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? "#101c22" : "#f6f7f8" }}
    >
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        {/* Header */}
        <View
          style={[
            styles.header,
            { borderBottomColor: isDark ? "#1c1c1c" : "#e2e2e2" },
          ]}
        >
          <MaterialIcons name="menu" size={32} color={isDark ? "#fff" : "#111"} />
          <Text style={[styles.headerTitle, { color: isDark ? "#fff" : "#111" }]}>
            Dashboard
          </Text>

          <View style={styles.connectionIndicator}>
            <View
              style={[
                styles.connectionDot,
                { backgroundColor: connectionColor },
              ]}
            />
            <Text style={{ color: connectionColor, fontSize: 12 }}>
              {isConnected ? "Connected" : "Disconnected"}
            </Text>
          </View>
        </View>

{/* Current State */}
<TouchableOpacity
  activeOpacity={0.8}
  onPress={() => navigation.navigate("DeviceConnection")}
  style={[
    styles.stateCard,
    { backgroundColor: isDark ? "#1c1c1c" : "#fff" },
  ]}
>
  <View
    style={[
      styles.stateIconCircle,
      { backgroundColor: `${stateInfo.color}20` },
    ]}
  >
    <MaterialIcons
      name={stateInfo.icon}
      size={48}
      color={stateInfo.color}
    />
  </View>

  <Text style={[styles.stateTitle, { color: stateInfo.color }]}>
    {prediction.state}
  </Text>

  <Text
    style={[
      styles.stateDesc,
      { color: isDark ? "#a0b3bd" : "#617c89" },
    ]}
  >
    {stateInfo.description}
  </Text>

  {prediction.confidence > 0 && (
    <Text
      style={[
        styles.confidenceText,
        { color: isDark ? "#a0b3bd" : "#617c89" },
      ]}
    >
      Confidence: {Math.round(prediction.confidence * 100)}%
    </Text>
  )}
</TouchableOpacity>

        {/* Real-time Monitoring */}
        <Text
          style={[styles.sectionTitle, { color: isDark ? "#fff" : "#111" }]}
        >
          Real-time Monitoring
        </Text>

        {/* Row 1 */}
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          {/* Heart Rate */}
          <View
            style={[
              styles.card,
              { backgroundColor: isDark ? "#1c1c1c" : "#fff", width: "48%" },
            ]}
          >
            <View style={[styles.iconCircle, { backgroundColor: "#ef444420" }]}>
              <MaterialIcons name="favorite" size={24} color="#ef4444" />
            </View>
            <View>
              <Text style={styles.cardLabel}>Heart Rate</Text>
              <Text style={styles.cardValue}>{heartRateDisplay}</Text>
              <Text style={styles.cardLabel}>{heartRateStatus}</Text>
            </View>
          </View>

          {/* EDA */}
          <View
            style={[
              styles.card,
              { backgroundColor: isDark ? "#1c1c1c" : "#fff", width: "48%" },
            ]}
          >
            <View style={[styles.iconCircle, { backgroundColor: "#8b5cf620" }]}>
              <MaterialIcons name="electric-bolt" size={24} color="#8b5cf6" />
            </View>
            <View>
              <Text style={styles.cardLabel}>EDA/GSR</Text>
              <Text style={styles.cardValue}>
                {sensorData.eda ? `${sensorData.eda.toFixed(2)} μS` : "--"}
              </Text>
            </View>
          </View>
        </View>

        {/* Motion */}
        <View style={{ marginTop: 16 }}>
          <View
            style={[
              styles.card,
              { backgroundColor: isDark ? "#1c1c1c" : "#fff" },
            ]}
          >
            <View style={[styles.iconCircle, { backgroundColor: `${motionColor}20` }]}>
              <MaterialIcons
                name={motionDetected ? "directions-run" : "accessibility"}
                size={24}
                color={motionColor}
              />
            </View>
            <View>
              <Text style={styles.cardLabel}>Motion Sense</Text>
              <Text style={[styles.cardValue, { color: motionColor }]}>{motionDisplay}</Text>
            </View>
          </View>
        </View>

        {/* Row 2 */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 24,
          }}
        >
          <View
            style={[
              styles.card,
              { backgroundColor: isDark ? "#1c1c1c" : "#fff", width: "48%" },
            ]}
          >
            <View style={[styles.iconCircle, { backgroundColor: "#22c55e20" }]}>
              <MaterialIcons
                name="sentiment-very-satisfied"
                size={24}
                color="#22c55e"
              />
            </View>
            <View>
              <Text style={styles.cardLabel}>Calm Score</Text>
              <Text style={styles.cardValue}>{calmScoreDisplay}</Text>
            </View>
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: isDark ? "#1c1c1c" : "#fff", width: "48%" },
            ]}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: isConnected ? "#22c55e20" : "#ef444420" },
              ]}
            >
              <MaterialIcons
                name="wifi"
                size={24}
                color={isConnected ? "#22c55e" : "#ef4444"}
              />
            </View>
            <View>
              <Text style={styles.cardLabel}>WiFi Status</Text>
              <Text style={styles.cardValue}>
                {isConnected ? "Online" : "Offline"}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* -------------------- STYLES -------------------- */

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  connectionIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginVertical: 12,
  },
  card: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  iconCircle: {
    padding: 12,
    borderRadius: 50,
    marginRight: 12,
  },
  cardLabel: {
    fontSize: 12,
    color: "#617c89",
  },
  cardValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  stateCard: {
    padding: 16,
    borderRadius: 16,
    marginVertical: 12,
    alignItems: "center",
  },
  stateIconCircle: {
    padding: 8,
    borderRadius: 100,
    marginBottom: 8,
  },
  stateTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  stateDesc: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
  },
  confidenceText: {
    fontSize: 12,
    marginTop: 4,
  },
});