import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Svg, Polyline } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  // Line graph data (weekly)
  const lineData = [12, 10, 14, 8, 15, 9, 11];
  const graphWidth = 300;
  const graphHeight = 100;
  const maxY = Math.max(...lineData);

  const points = lineData
    .map(
      (val, i) =>
        `${(i * (graphWidth / (lineData.length - 1))).toFixed(2)},${(
          graphHeight -
          (val / maxY) * graphHeight
        ).toFixed(2)}`
    )
    .join(" ");

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
          <View style={{ width: 32 }} />
        </View>

        {/* Current State */}
        <View
          style={[
            styles.stateCard,
            { backgroundColor: isDark ? "#1c1c1c" : "#fff" },
          ]}
        >
          <View style={styles.stateIconCircle}>
            <MaterialIcons name="self-improvement" size={48} color="#22c55e" />
          </View>
          <Text
            style={[
              styles.stateTitle,
              { color: isDark ? "#22c55e" : "#16a34a" },
            ]}
          >
            Calm
          </Text>
          <Text
            style={[
              styles.stateDesc,
              { color: isDark ? "#a0b3bd" : "#617c89" },
            ]}
          >
            Child is currently calm and relaxed.
          </Text>
        </View>

        {/* Real-time Monitoring */}
        <Text
          style={[styles.sectionTitle, { color: isDark ? "#fff" : "#111" }]}
        >
          Real-time Monitoring
        </Text>

        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          {[
            {
              icon: "favorite",
              title: "Heart Rate",
              value: "85 bpm",
              subtitle: "Resting",
            },
            {
              icon: "sentiment-very-satisfied",
              title: "Calm Score",
              value: "92",
              subtitle: "Excellent",
            },
          ].map((card, idx) => (
            <View
              key={idx}
              style={[
                styles.card,
                {
                  backgroundColor: isDark ? "#1c1c1c" : "#fff",
                  width: "48%",
                },
              ]}
            >
              <View style={styles.iconCircle}>
                <MaterialIcons name={card.icon} size={24} color="#13a4ec" />
              </View>
              <View>
                <Text
                  style={[
                    styles.cardLabel,
                    { color: isDark ? "#a0b3bd" : "#617c89" },
                  ]}
                >
                  {card.title}
                </Text>
                <Text
                  style={[
                    styles.cardValue,
                    { color: isDark ? "#fff" : "#111" },
                  ]}
                >
                  {card.value}
                </Text>
                <Text
                  style={[
                    styles.cardLabel,
                    { color: isDark ? "#a0b3bd" : "#617c89" },
                  ]}
                >
                  {card.subtitle}
                </Text>
              </View>
            </View>
          ))}
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
          <Svg width={graphWidth} height={graphHeight}>
            <Polyline
              points={points}
              fill="none"
              stroke="#13a4ec"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </Svg>

          {/* Weekday labels */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 4,
            }}
          >
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, idx) => (
              <Text
                key={idx}
                style={{
                  fontSize: 10,
                  color: isDark ? "#a0b3bd" : "#617c89",
                }}
              >
                {day}
              </Text>
            ))}
          </View>
        </View>
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
    backgroundColor: "#dcfce720",
    padding: 8,
    borderRadius: 100,
    marginBottom: 8,
  },
  stateTitle: { fontSize: 20, fontWeight: "bold" },
  stateDesc: { fontSize: 14, textAlign: "center", marginTop: 4 },
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
});
