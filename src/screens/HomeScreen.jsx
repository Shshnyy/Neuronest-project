import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Svg, Polyline, Circle } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { WearableContext, MIND_STATES } from "../context/WearableContext";

export default function HomeScreen({ navigation }) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  // Get data from WearableContext
  const {
    isConnected,
    sensorData,
    prediction,
    getWeeklyStressData,
    getStateInfo,
    isModelReady,
  } = useContext(WearableContext);

  // Local state for weekly data
  const [weeklyData, setWeeklyData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load weekly stress data
  useEffect(() => {
    loadWeeklyData();
  }, []);

  const loadWeeklyData = async () => {
    try {
      const data = await getWeeklyStressData();
      if (data && data.length > 0) {
        setWeeklyData(data.map((d) => d.count));
      } else {
        setWeeklyData([0, 0, 0, 0, 0, 0, 0]);
      }
    } catch (error) {
      console.error("Error loading weekly data:", error);
      setWeeklyData([0, 0, 0, 0, 0, 0, 0]);
    } finally {
      setIsLoading(false);
    }
  };

  // Get state info based on prediction
  const stateInfo = getStateInfo(prediction.state);

  // Calculate graph points
  const graphWidth = 300;
  const graphHeight = 100;
  const lineData = weeklyData.length > 0 ? weeklyData : [0, 0, 0, 0, 0, 0, 0];
  const maxY = Math.max(...lineData, 1);

  const points = lineData
    .map(
      (val, i) =>
        `${(i * (graphWidth / (lineData.length - 1))).toFixed(2)},${(
          graphHeight -
          (val / maxY) * graphHeight
        ).toFixed(2)}`
    )
    .join(" ");

  // Format sensor values — only show HR when finger is actually on the sensor
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
          <Text
            style={[styles.headerTitle, { color: isDark ? "#fff" : "#111" }]}
          >
            Dashboard
          </Text>
          {/* Connection Status Indicator */}
          <View
            style={styles.connectionIndicator}
          >
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

        {/* Current State Card */}
        <View
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
          {!isConnected && (
            <TouchableOpacity
              style={styles.connectButton}
              onPress={() => navigation.navigate("DeviceConnection")}
            >
              <Text style={styles.connectButtonText}>Connect Device</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Recommendation Banner */}
        {prediction.state !== MIND_STATES.UNKNOWN && prediction.state !== MIND_STATES.CALM && (
          <View
            style={[
              styles.recommendationBanner,
              {
                backgroundColor:
                  prediction.state === MIND_STATES.MELTDOWN
                    ? "#fef2f2"
                    : "#fffbeb",
                borderColor:
                  prediction.state === MIND_STATES.MELTDOWN
                    ? "#ef4444"
                    : "#f59e0b",
              },
            ]}
          >
            <MaterialIcons
              name="lightbulb"
              size={20}
              color={
                prediction.state === MIND_STATES.MELTDOWN
                  ? "#ef4444"
                  : "#f59e0b"
              }
            />
            <Text style={styles.recommendationText}>
              {stateInfo.recommendation}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Relief")}>
              <Text style={styles.reliefLink}>Try Relief →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Real-time Monitoring */}
        <Text
          style={[styles.sectionTitle, { color: isDark ? "#fff" : "#111" }]}
        >
          Real-time Monitoring
        </Text>

        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          {/* Heart Rate Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? "#1c1c1c" : "#fff",
                width: "48%",
              },
            ]}
          >
            <View style={[styles.iconCircle, { backgroundColor: "#ef444420" }]}>
              <MaterialIcons name="favorite" size={24} color="#ef4444" />
            </View>
            <View>
              <Text
                style={[
                  styles.cardLabel,
                  { color: isDark ? "#a0b3bd" : "#617c89" },
                ]}
              >
                Heart Rate
              </Text>
              <Text
                style={[
                  styles.cardValue,
                  { color: isDark ? "#fff" : "#111" },
                ]}
              >
                {heartRateDisplay}
              </Text>
              <Text
                style={[
                  styles.cardLabel,
                  { color: isDark ? "#a0b3bd" : "#617c89" },
                ]}
              >
                {heartRateStatus}
              </Text>
            </View>
          </View>

          {/* Calm Score Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? "#1c1c1c" : "#fff",
                width: "48%",
              },
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
              <Text
                style={[
                  styles.cardLabel,
                  { color: isDark ? "#a0b3bd" : "#617c89" },
                ]}
              >
                Calm Score
              </Text>
              <Text
                style={[
                  styles.cardValue,
                  { color: isDark ? "#fff" : "#111" },
                ]}
              >
                {calmScoreDisplay}
              </Text>
              <Text
                style={[
                  styles.cardLabel,
                  { color: isDark ? "#a0b3bd" : "#617c89" },
                ]}
              >
                {calmScoreStatus}
              </Text>
            </View>
          </View>
        </View>

        {/* Additional Sensor Cards */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 8,
          }}
        >
          {/* WiFi Status Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? "#1c1c1c" : "#fff",
                width: "48%",
              },
            ]}
          >
            <View style={[styles.iconCircle, { backgroundColor: isConnected ? "#22c55e20" : "#ef444420" }]}>
              <MaterialIcons name="wifi" size={24} color={isConnected ? "#22c55e" : "#ef4444"} />
            </View>
            <View>
              <Text
                style={[
                  styles.cardLabel,
                  { color: isDark ? "#a0b3bd" : "#617c89" },
                ]}
              >
                WiFi Status
              </Text>
              <Text
                style={[
                  styles.cardValue,
                  { color: isDark ? "#fff" : "#111" },
                ]}
              >
                {isConnected ? "Online" : "Offline"}
              </Text>
              <Text
                style={[
                  styles.cardLabel,
                  { color: isConnected ? "#22c55e" : "#ef4444" },
                ]}
              >
                {isConnected ? "ESP32 Connected" : "Not Connected"}
              </Text>
            </View>
          </View>

          {/* EDA Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? "#1c1c1c" : "#fff",
                width: "48%",
              },
            ]}
          >
            <View style={[styles.iconCircle, { backgroundColor: "#8b5cf620" }]}>
              <MaterialIcons name="electric-bolt" size={24} color="#8b5cf6" />
            </View>
            <View>
              <Text
                style={[
                  styles.cardLabel,
                  { color: isDark ? "#a0b3bd" : "#617c89" },
                ]}
              >
                EDA/GSR
              </Text>
              <Text
                style={[
                  styles.cardValue,
                  { color: isDark ? "#fff" : "#111" },
                ]}
              >
                {sensorData.eda ? `${sensorData.eda.toFixed(2)} μS` : "--"}
              </Text>
              <Text
                style={[
                  styles.cardLabel,
                  { color: isDark ? "#a0b3bd" : "#617c89" },
                ]}
              >
                {sensorData.eda
                  ? sensorData.eda > 4
                    ? "Elevated"
                    : "Normal"
                  : "No data"}
              </Text>
            </View>
          </View>
        </View>

        {/* Stress Episode Trends */}
        <Text
          style={[styles.sectionTitle, { color: isDark ? "#fff" : "#111" }]}
        >
          Stress Episode Trends
        </Text>

        <View style={styles.trendTabs}>
          <TouchableOpacity style={styles.trendButtonActive}>
            <Text style={styles.trendButtonTextActive}>Weekly</Text>
          </TouchableOpacity>
        </View>

        {/* Line Graph */}
        <View
          style={{
            marginTop: 16,
            backgroundColor: isDark ? "#1c1c1c" : "#fff",
            padding: 12,
            borderRadius: 16,
          }}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#13a4ec" />
              <Text
                style={{ color: isDark ? "#a0b3bd" : "#617c89", marginTop: 8 }}
              >
                Loading data...
              </Text>
            </View>
          ) : (
            <>
              <Svg width={graphWidth} height={graphHeight}>
                <Polyline
                  points={points}
                  fill="none"
                  stroke="#13a4ec"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                {/* Data points */}
                {lineData.map((val, i) => (
                  <Circle
                    key={i}
                    cx={(i * (graphWidth / (lineData.length - 1))).toFixed(2)}
                    cy={(
                      graphHeight -
                      (val / maxY) * graphHeight
                    ).toFixed(2)}
                    r="4"
                    fill="#13a4ec"
                  />
                ))}
              </Svg>

              {/* Weekday labels */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginTop: 4,
                }}
              >
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                  (day, idx) => (
                    <Text
                      key={idx}
                      style={{
                        fontSize: 10,
                        color: isDark ? "#a0b3bd" : "#617c89",
                      }}
                    >
                      {day}
                    </Text>
                  )
                )}
              </View>
            </>
          )}
        </View>

        {/* Model Status */}
        {!isModelReady && (
          <View style={styles.modelStatusBanner}>
            <MaterialIcons name="info" size={16} color="#3b82f6" />
            <Text style={styles.modelStatusText}>
              Using rule-based predictions. Add ML model for better accuracy.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  connectionIndicator: {
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginVertical: 12 },
  card: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  iconCircle: {
    backgroundColor: "#13a4ec20",
    padding: 12,
    borderRadius: 50,
    marginRight: 12,
  },
  cardLabel: { fontSize: 12 },
  cardValue: { fontSize: 18, fontWeight: "bold" },
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
  stateTitle: { fontSize: 20, fontWeight: "bold" },
  stateDesc: { fontSize: 14, textAlign: "center", marginTop: 4 },
  confidenceText: { fontSize: 12, marginTop: 4 },
  connectButton: {
    backgroundColor: "#13a4ec",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 12,
  },
  connectButtonText: { color: "#fff", fontWeight: "bold" },
  recommendationBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    flexWrap: "wrap",
  },
  recommendationText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: "#374151",
  },
  reliefLink: {
    color: "#13a4ec",
    fontWeight: "bold",
    fontSize: 13,
  },
  trendTabs: {
    backgroundColor: "#e5e7eb40",
    borderRadius: 100,
    paddingVertical: 6,
    alignItems: "center",
  },
  trendButtonActive: {
    backgroundColor: "#13a4ec",
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 100,
  },
  trendButtonTextActive: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  loadingContainer: {
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  modelStatusBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#eff6ff",
    borderRadius: 8,
    marginTop: 16,
  },
  modelStatusText: {
    marginLeft: 8,
    fontSize: 12,
    color: "#3b82f6",
  },
});
