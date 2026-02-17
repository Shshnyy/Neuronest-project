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

export default function HistoryScreen({ navigation }) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const { getTodayHistory, getStateInfo, predictionHistory } = useContext(WearableContext);

  const [historyData, setHistoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      const data = await getTodayHistory();
      // Sort by timestamp descending (newest first)
      const sortedData = data.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      setHistoryData(sortedData);
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setIsLoading(false);
    }
  }, [getTodayHistory]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory, predictionHistory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  }, [loadHistory]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
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

        {/* Pull to refresh placeholder */}
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

        {/* History List */}
        <Text
          style={[styles.sectionTitle, { color: isDark ? "#fff" : "#111" }]}
        >
          Today
        </Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#13a4ec" />
            <Text style={[styles.loadingText, { color: isDark ? "#a0b3bd" : "#617c89" }]}>
              Loading history...
            </Text>
          </View>
        ) : historyData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="history" size={48} color={isDark ? "#a0b3bd" : "#617c89"} />
            <Text style={[styles.emptyText, { color: isDark ? "#a0b3bd" : "#617c89" }]}>
              No history data yet
            </Text>
            <Text style={[styles.emptySubtext, { color: isDark ? "#a0b3bd" : "#617c89" }]}>
              Connect your wearable to start tracking
            </Text>
          </View>
        ) : (
          historyData.map((item, index) => {
            const iconInfo = getIconForState(item.state);
            return (
              <View
                key={item.id || index}
                style={[
                  styles.historyItem,
                  { backgroundColor: isDark ? "#1c1c1c" : "#fff" },
                ]}
              >
                <View style={[styles.iconCircle, { backgroundColor: `${iconInfo.color}20` }]}>
                  <MaterialIcons
                    name={iconInfo.name}
                    size={28}
                    color={iconInfo.color}
                  />
                </View>
                <View style={styles.historyContent}>
                  <Text
                    style={[
                      styles.historyMood,
                      { color: isDark ? "#fff" : "#111" },
                    ]}
                  >
                    {item.state}
                  </Text>
                  <Text
                    style={[
                      styles.historyTime,
                      { color: isDark ? "#a0b3bd" : "#617c89" },
                    ]}
                  >
                    {formatTime(item.timestamp)}
                  </Text>
                </View>
                {item.confidence && (
                  <View style={styles.confidenceBadge}>
                    <Text style={styles.confidenceText}>
                      {Math.round(item.confidence * 100)}%
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Footer Buttons */}
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
            View Weekly History
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
  historyTime: { fontSize: 12 },
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
