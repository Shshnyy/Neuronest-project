import React, { useEffect, useState, useContext } from "react";
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
import StorageService from "../services/StorageService";

export default function WeeklyHistory({ navigation }) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeeklyData();
  }, []);

  const loadWeeklyData = async () => {
    try {
      const predictions = await StorageService.getPredictions();
      const now = new Date();

      // Build one entry per day for the last 7 days
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const day = new Date(now);
        day.setDate(day.getDate() - i);
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const dayPreds = predictions.filter((p) => {
          const d = new Date(p.timestamp);
          return d >= dayStart && d < dayEnd;
        });

        const calmCount = dayPreds.filter((p) => p.state === "Calm").length;
        const total = dayPreds.length;
        const avgConfidence =
          total > 0
            ? dayPreds.reduce((s, p) => s + (p.confidence || 0), 0) / total
            : 0;

        // Severity label based on non-calm ratio
        const nonCalmRatio = total > 0 ? (total - calmCount) / total : 0;
        let severity, color;
        if (nonCalmRatio === 0) {
          severity = "All Calm";
          color = "#22c55e";
        } else if (nonCalmRatio < 0.2) {
          severity = "Mostly Calm";
          color = "#22c55e";
        } else if (nonCalmRatio < 0.5) {
          severity = "Moderate";
          color = "#f59e0b";
        } else {
          severity = "Elevated";
          color = "#ef4444";
        }

        days.push({
          dayName: dayStart.toLocaleDateString("en-US", { weekday: "long" }),
          dateLabel: dayStart.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          total,
          calmCount,
          avgConfidence,
          severity,
          color,
          isToday: i === 0,
        });
      }

      setWeeklyData(days);
    } catch (error) {
      console.error("Error loading weekly data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#101c22" : "#f6f7f8" },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: isDark ? "#101c22" : "#f6f7f8",
            borderBottomColor: isDark ? "#1c1c1c" : "#e2e2e2",
          },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons
            name="arrow-back-ios"
            size={24}
            color={isDark ? "#fff" : "#111"}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? "#fff" : "#111" }]}>
          Weekly Summary
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#13a4ec"
            style={{ marginTop: 40 }}
          />
        ) : (
          weeklyData.map((item) => (
            <View
              key={item.dayName}
              style={[
                styles.card,
                { backgroundColor: isDark ? "#1c1c1c" : "#fff" },
              ]}
            >
              <View style={styles.cardLeft}>
                {item.isToday && (
                  <Text style={styles.todayLabel}>Today</Text>
                )}
                <Text
                  style={[
                    styles.dayText,
                    { color: isDark ? "#fff" : "#111" },
                  ]}
                >
                  {item.dayName}
                </Text>
                <Text
                  style={[
                    styles.dateText,
                    { color: isDark ? "#a0b3bd" : "#617c89" },
                  ]}
                >
                  {item.dateLabel}
                </Text>
                <Text style={styles.recordsText}>
                  {item.total} reading{item.total !== 1 ? "s" : ""} ·{" "}
                  <Text style={{ color: item.color, fontWeight: "600" }}>
                    {item.severity}
                  </Text>
                </Text>
              </View>

              {/* Mini confidence bar */}
              <View style={styles.cardRight}>
                <Text style={[styles.confLabel, { color: isDark ? "#a0b3bd" : "#617c89" }]}>
                  Avg conf.
                </Text>
                <Text style={[styles.confValue, { color: item.color }]}>
                  {item.avgConfidence > 0
                    ? `${Math.round(item.avgConfidence * 100)}%`
                    : "–"}
                </Text>
                <View style={styles.barBg}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.round(item.avgConfidence * 100)}%`,
                        backgroundColor: item.color,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    paddingTop: 48,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  scrollContainer: { padding: 16, paddingBottom: 80 },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardLeft: { flex: 1 },
  todayLabel: { fontSize: 12, fontWeight: "700", color: "#13a4ec" },
  dayText: { fontSize: 16, fontWeight: "700", marginVertical: 2 },
  dateText: { fontSize: 13 },
  recordsText: { fontSize: 13, color: "#666", marginTop: 4 },
  cardRight: { alignItems: "flex-end", width: 80 },
  confLabel: { fontSize: 10, marginBottom: 2 },
  confValue: { fontSize: 16, fontWeight: "700" },
  barBg: {
    width: 60,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#e2e2e2",
    marginTop: 4,
    overflow: "hidden",
  },
  barFill: { height: 5, borderRadius: 3 },
});