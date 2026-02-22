import React, { useContext, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { WearableContext, MIND_STATES } from "../context/WearableContext";
import StorageService from "../services/StorageService";

export default function HistoryScreen({ navigation }) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const { getStateInfo, predictionHistory } = useContext(WearableContext);

  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ─── helpers ────────────────────────────────────────────
  const startOfDay = (d) => {
    const s = new Date(d);
    s.setHours(0, 0, 0, 0);
    return s;
  };

  const buildSections = (predictions) => {
    const now = new Date();
    const today = startOfDay(now);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 6);
    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(lastWeekStart.getDate() - 13);

    const buckets = {
      Today: [],
      Yesterday: [],
      "Earlier This Week": [],
      "Last Week": [],
    };

    predictions.forEach((p) => {
      const d = new Date(p.timestamp);
      if (d >= today) {
        buckets["Today"].push(p);
      } else if (d >= yesterday) {
        buckets["Yesterday"].push(p);
      } else if (d >= weekStart) {
        buckets["Earlier This Week"].push(p);
      } else if (d >= lastWeekStart) {
        buckets["Last Week"].push(p);
      }
    });

    // Sort each bucket newest-first
    Object.values(buckets).forEach((arr) =>
      arr.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    );

    return Object.entries(buckets)
      .filter(([, items]) => items.length > 0)
      .map(([title, data]) => ({ title, data }));
  };

  const loadHistory = useCallback(async () => {
    try {
      const all = await StorageService.getPredictions();
      setSections(buildSections(all));
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory, predictionHistory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  }, [loadHistory]);

  // ─── formatting ─────────────────────────────────────────
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getIconForState = (state) => {
    switch (state) {
      case MIND_STATES.CALM:
        return { name: "self-improvement", color: "#22c55e" };
      case MIND_STATES.STRESSED:
        return { name: "warning", color: "#f59e0b" };
      case MIND_STATES.MELTDOWN:
        return { name: "error", color: "#ef4444" };
      case MIND_STATES.AMUSEMENT:
        return { name: "sentiment-satisfied", color: "#3b82f6" };
      default:
        return { name: "help", color: "#6b7280" };
    }
  };

  // ─── render a single history row ────────────────────────
  const renderItem = (item, index, showDate) => {
    const iconInfo = getIconForState(item.state);
    return (
      <View
        key={item.id || index}
        style={[
          styles.historyItem,
          { backgroundColor: isDark ? "#1c1c1c" : "#fff" },
        ]}
      >
        <View
          style={[styles.iconCircle, { backgroundColor: `${iconInfo.color}20` }]}
        >
          <MaterialIcons name={iconInfo.name} size={28} color={iconInfo.color} />
        </View>
        <View style={styles.historyContent}>
          <Text
            style={[styles.historyMood, { color: isDark ? "#fff" : "#111" }]}
          >
            {item.state}
          </Text>
          <Text
            style={[styles.historyTime, { color: isDark ? "#a0b3bd" : "#617c89" }]}
          >
            {showDate
              ? `${formatDate(item.timestamp)}  •  ${formatTime(item.timestamp)}`
              : formatTime(item.timestamp)}
          </Text>
          {item.sensorData && (
            <Text
              style={[styles.sensorHint, { color: isDark ? "#6e8a99" : "#90a4ae" }]}
            >
              HR {Math.round(item.sensorData.heartRate)} · EDA{" "}
              {item.sensorData.eda?.toFixed?.(1) ?? "–"} ·{" "}
              {item.sensorData.temperature?.toFixed?.(1) ?? "–"}°C
            </Text>
          )}
        </View>
        {item.confidence != null && (
          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>
              {Math.round(item.confidence * 100)}%
            </Text>
          </View>
        )}
      </View>
    );
  };

  // ─── main render ────────────────────────────────────────
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#101c22" : "#f6f7f8" },
      ]}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconButton} />
          <Text style={[styles.title, { color: isDark ? "#fff" : "#111" }]}>
            History
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Pull to refresh hint */}
        <View style={styles.pullRefresh}>
          <MaterialIcons
            name="refresh"
            size={20}
            color={isDark ? "#a0b3bd" : "#617c89"}
          />
          <Text
            style={[styles.pullText, { color: isDark ? "#a0b3bd" : "#617c89" }]}
          >
            Pull to refresh
          </Text>
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#13a4ec" />
            <Text
              style={[styles.loadingText, { color: isDark ? "#a0b3bd" : "#617c89" }]}
            >
              Loading history...
            </Text>
          </View>
        ) : sections.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons
              name="history"
              size={48}
              color={isDark ? "#a0b3bd" : "#617c89"}
            />
            <Text
              style={[styles.emptyText, { color: isDark ? "#a0b3bd" : "#617c89" }]}
            >
              No history data yet
            </Text>
            <Text
              style={[
                styles.emptySubtext,
                { color: isDark ? "#a0b3bd" : "#617c89" },
              ]}
            >
              Connect your wearable to start tracking
            </Text>
          </View>
        ) : (
          sections.map((section) => {
            const needsDate =
              section.title === "Earlier This Week" ||
              section.title === "Last Week";
            return (
              <View key={section.title} style={{ marginBottom: 16 }}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: isDark ? "#fff" : "#111" },
                  ]}
                >
                  {section.title}
                </Text>
                {section.data.map((item, idx) =>
                  renderItem(item, idx, needsDate)
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Footer */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: isDark ? "#101c22" : "#f6f7f8",
            borderTopColor: isDark ? "#1c1c1c" : "#e2e2e2",
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.getParent()?.navigate("WeeklyHistory")}
          style={[
            styles.weeklyButton,
            { backgroundColor: "#13a4ec30", borderColor: "#13a4ec" },
          ]}
        >
          <Text style={{ color: "#13a4ec", fontWeight: "bold" }}>
            View Weekly Summary
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 35,
  },
  iconButton: { width: 40, alignItems: "center" },
  title: { fontSize: 18, fontWeight: "bold" },
  pullRefresh: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 1,
  },
  pullText: { fontSize: 12, marginLeft: 6 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 8 },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  historyContent: { flex: 1 },
  historyMood: { fontWeight: "bold", fontSize: 14 },
  historyTime: { fontSize: 12, marginTop: 2 },
  sensorHint: { fontSize: 11, marginTop: 2 },
  confidenceBadge: {
    backgroundColor: "#13a4ec20",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  confidenceText: {
    fontSize: 11,
    color: "#13a4ec",
    fontWeight: "600",
  },
  footer: { padding: 12, borderTopWidth: 1 },
  weeklyButton: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    alignItems: "center",
  },
  loadingContainer: {
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    marginTop: 4,
  },
});
