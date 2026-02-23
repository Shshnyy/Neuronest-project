import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
} from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { WearableContext } from "../context/WearableContext";
import ConfigManager from "../utils/ConfigManager";

export default function DeviceInfo({ navigation }) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const {
    isConnected,
    isConnecting,
    isScanning,
    availableDevices,
    connectedDevice,
    connectionError,
    deviceInfo,
    sensorData,
    scanForDevices,
    stopScan,
    connectToDevice,
    disconnectDevice,
    refreshDeviceInfo,
    startMockDataStream,
    stopMockDataStream,
  } = useContext(WearableContext);

  const [refreshing, setRefreshing] = useState(false);
  const [showIPModal, setShowIPModal] = useState(false);
  const [ipAddress, setIpAddress] = useState("");
  const [port, setPort] = useState("80");

  // Load saved IP and port from config on mount
  useEffect(() => {
    const loadSavedConfig = async () => {
      await ConfigManager.loadConfig();
      const savedIP = ConfigManager.getESP32IP();
      const savedPort = ConfigManager.getESP32Port();
      setIpAddress(savedIP);
      setPort(savedPort.toString());
    };
    loadSavedConfig();
  }, []);

  // Calculate last sync time display
  const getLastSyncDisplay = () => {
    if (!deviceInfo.lastSync) return "Never";
    const lastSync = new Date(deviceInfo.lastSync);
    const now = new Date();
    const diffMs = now - lastSync;
    const diffSecs = Math.floor(diffMs / 1000);

    if (diffSecs < 5) return "Just now";
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    return `${Math.floor(diffSecs / 3600)}h ago`;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshDeviceInfo();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleScan = async () => {
    // WiFi mode - show IP input modal
    setShowIPModal(true);
  };

  const handleConnectWithIP = async () => {
    if (!ipAddress.trim()) {
      Alert.alert("Error", "Please enter ESP32 IP address");
      return;
    }

    // Validate IP format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ipAddress.trim())) {
      Alert.alert("Error", "Invalid IP address format");
      return;
    }

    const portNum = parseInt(port) || 80;

    setShowIPModal(false);

    try {
      const result = await connectToDevice(ipAddress.trim(), portNum);
      if (!result.success) {
        Alert.alert("Connection Failed", result.error);
      } else {
        Alert.alert("Success", `Connected to ${ipAddress}:${portNum}`);
      }
    } catch (error) {
      Alert.alert("Connection Error", error.message);
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      "Disconnect Device",
      "Are you sure you want to disconnect from the wearable?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: disconnectDevice,
        },
      ]
    );
  };

  const handleDemoMode = () => {
    if (isConnected && connectedDevice?.id === "mock-device") {
      stopMockDataStream();
    } else {
      startMockDataStream();
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
        <View style={{ width: 24 }} />
        <Text style={[styles.headerTitle, { color: isDark ? "#fff" : "#111" }]}>
          Device Info
        </Text>
        <TouchableOpacity onPress={handleDemoMode}>
          <MaterialIcons
            name={
              isConnected && connectedDevice?.id === "mock-device"
                ? "stop"
                : "play-arrow"
            }
            size={24}
            color="#13a4ec"
          />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Connection Status Card */}
        <View
          style={[
            styles.statusCard,
            { backgroundColor: isDark ? "#1c1c1c" : "#fff" },
          ]}
        >
          <View style={styles.connectionHeader}>
            <View
              style={[
                styles.connectionIcon,
                {
                  backgroundColor: isConnected ? "#22c55e20" : "#ef444420",
                },
              ]}
            >
              <MaterialIcons
                name={isConnected ? "wifi" : "wifi-off"}
                size={32}
                color={isConnected ? "#22c55e" : "#ef4444"}
              />
            </View>
            <View style={styles.connectionInfo}>
              <Text
                style={[
                  styles.connectionTitle,
                  { color: isDark ? "#fff" : "#111" },
                ]}
              >
                {isConnected ? "Connected" : "Disconnected"}
              </Text>
              {isConnected && connectedDevice && (
                <Text
                  style={[
                    styles.deviceName,
                    { color: isDark ? "#a0b3bd" : "#617c89" },
                  ]}
                >
                  {connectedDevice.name}
                </Text>
              )}
            </View>
          </View>

          {isConnected ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.disconnectButton]}
              onPress={handleDisconnect}
            >
              <Text style={styles.disconnectButtonText}>Disconnect</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.scanButton]}
              onPress={handleScan}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.scanButtonText}>Enter IP Address</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* IP Address Input Modal */}
        <Modal
          visible={showIPModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowIPModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: isDark ? "#1c1c1c" : "#fff" },
              ]}
            >
              <Text
                style={[
                  styles.modalTitle,
                  { color: isDark ? "#fff" : "#111" },
                ]}
              >
                Connect to ESP32
              </Text>

              <Text
                style={[
                  styles.modalLabel,
                  { color: isDark ? "#a0b3bd" : "#617c89" },
                ]}
              >
                IP Address
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? "#2c2c2c" : "#f6f7f8",
                    color: isDark ? "#fff" : "#111",
                  },
                ]}
                placeholder="192.168.1.100"
                placeholderTextColor={isDark ? "#666" : "#999"}
                value={ipAddress}
                onChangeText={setIpAddress}
                keyboardType="numeric"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text
                style={[
                  styles.modalLabel,
                  { color: isDark ? "#a0b3bd" : "#617c89" },
                ]}
              >
                Port (Optional)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? "#2c2c2c" : "#f6f7f8",
                    color: isDark ? "#fff" : "#111",
                  },
                ]}
                placeholder="80"
                placeholderTextColor={isDark ? "#666" : "#999"}
                value={port}
                onChangeText={setPort}
                keyboardType="numeric"
              />

              <Text
                style={[
                  styles.modalHint,
                  { color: isDark ? "#a0b3bd" : "#617c89" },
                ]}
              >
                Check Arduino Serial Monitor for ESP32 IP address
              </Text>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.cancelButton,
                    { borderColor: isDark ? "#666" : "#ccc" },
                  ]}
                  onPress={() => setShowIPModal(false)}
                >
                  <Text
                    style={[
                      styles.cancelButtonText,
                      { color: isDark ? "#a0b3bd" : "#617c89" },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.connectButtonModal]}
                  onPress={handleConnectWithIP}
                >
                  <Text style={styles.connectButtonText}>Connect</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Error Message */}
        {connectionError && !showIPModal && (
          <View style={styles.errorBanner}>
            <MaterialIcons name="error-outline" size={20} color="#ef4444" />
            <Text style={styles.errorText}>{connectionError}</Text>
          </View>
        )}

        {/* ESP32 Info */}
        <View
          style={[
            styles.infoCard,
            { backgroundColor: isDark ? "#1c1c1c" : "#fff" },
          ]}
        >
          <MaterialCommunityIcons name="wifi" size={24} color="#13a4ec" />
          <View style={styles.infoContent}>
            <Text
              style={[styles.infoTitle, { color: isDark ? "#fff" : "#111" }]}
            >
              ESP32 WiFi Connection
            </Text>
            <Text
              style={[
                styles.infoDesc,
                { color: isDark ? "#a0b3bd" : "#617c89" },
              ]}
            >
              ESP32 runs HTTP server on local WiFi network. Ensure both devices
              are on the same network. Check Serial Monitor for ESP32's IP
              address.
            </Text>
            {connectedDevice?.ip && (
              <Text
                style={[
                  styles.infoDesc,
                  { color: "#13a4ec", marginTop: 8, fontWeight: "600" },
                ]}
              >
                Connected: {connectedDevice.ip}:{connectedDevice.port || 80}
              </Text>
            )}
          </View>
        </View>

        {/* Sensor Status */}
        <Text
          style={[styles.sectionTitle, { color: isDark ? "#fff" : "#111" }]}
        >
          Sensor Status
        </Text>
        <View
          style={[
            styles.sensorGrid,
            { backgroundColor: isDark ? "#1c1c1c" : "#fff" },
          ]}
        >
          <View style={styles.sensorCard}>
            <MaterialIcons name="favorite" size={32} color="#ef4444" />
            <Text
              style={[
                styles.sensorName,
                { color: isDark ? "#fff" : "#111" },
              ]}
            >
              Heart Rate
            </Text>
            <Text
              style={[
                styles.sensorValue,
                {
                  color:
                    sensorData.heartRate > 0
                      ? "#22c55e"
                      : isDark
                      ? "#666"
                      : "#ccc",
                },
              ]}
            >
              {sensorData.heartRate > 0
                ? `${sensorData.heartRate.toFixed(1)} BPM`
                : "No Data"}
            </Text>
          </View>

          <View style={styles.sensorCard}>
            <MaterialIcons name="thermostat" size={32} color="#f97316" />
            <Text
              style={[
                styles.sensorName,
                { color: isDark ? "#fff" : "#111" },
              ]}
            >
              Temperature
            </Text>
            <Text
              style={[
                styles.sensorValue,
                {
                  color:
                    sensorData.temperature > 0
                      ? "#22c55e"
                      : isDark
                      ? "#666"
                      : "#ccc",
                },
              ]}
            >
              {sensorData.temperature > 0
                ? `${sensorData.temperature.toFixed(1)}°C`
                : "No Data"}
            </Text>
          </View>

          <View style={styles.sensorCard}>
            <MaterialCommunityIcons
              name="water-outline"
              size={32}
              color="#3b82f6"
            />
            <Text
              style={[
                styles.sensorName,
                { color: isDark ? "#fff" : "#111" },
              ]}
            >
              EDA/GSR
            </Text>
            <Text
              style={[
                styles.sensorValue,
                {
                  color:
                    sensorData.eda >= 0
                      ? "#22c55e"
                      : isDark
                      ? "#666"
                      : "#ccc",
                },
              ]}
            >
              {sensorData.eda > 2400
                ? "No Finger Detected"
                : sensorData.eda >= 0
                  ? `${sensorData.eda.toFixed(2)} µS`
                  : "No Data"}
            </Text>
          </View>
        </View>

        {/* Device Health */}
        <Text
          style={[styles.sectionTitle, { color: isDark ? "#fff" : "#111" }]}
        >
          Device Health
        </Text>
        <View style={styles.healthGrid}>
          <View
            style={[
              styles.healthCard,
              { backgroundColor: isDark ? "#1c1c1c" : "#fff" },
            ]}
          >
            <MaterialIcons name="battery-full" size={24} color="#22c55e" />
            <Text
              style={[
                styles.healthLabel,
                { color: isDark ? "#a0b3bd" : "#617c89" },
              ]}
            >
              Battery
            </Text>
            <Text
              style={[
                styles.healthValue,
                { color: isDark ? "#fff" : "#111" },
              ]}
            >
              {deviceInfo.batteryLevel || "N/A"}
            </Text>
          </View>

          <View
            style={[
              styles.healthCard,
              { backgroundColor: isDark ? "#1c1c1c" : "#fff" },
            ]}
          >
            <MaterialIcons name="signal-cellular-alt" size={24} color="#3b82f6" />
            <Text
              style={[
                styles.healthLabel,
                { color: isDark ? "#a0b3bd" : "#617c89" },
              ]}
            >
              Signal
            </Text>
            <Text
              style={[
                styles.healthValue,
                { color: isDark ? "#fff" : "#111" },
              ]}
            >
              {deviceInfo.signalStrength || "N/A"}
            </Text>
          </View>

          <View
            style={[
              styles.healthCard,
              { backgroundColor: isDark ? "#1c1c1c" : "#fff" },
            ]}
          >
            <MaterialIcons name="sync" size={24} color="#f97316" />
            <Text
              style={[
                styles.healthLabel,
                { color: isDark ? "#a0b3bd" : "#617c89" },
              ]}
            >
              Last Sync
            </Text>
            <Text
              style={[
                styles.healthValue,
                { color: isDark ? "#fff" : "#111" },
              ]}
            >
              {getLastSyncDisplay()}
            </Text>
          </View>

          <View
            style={[
              styles.healthCard,
              { backgroundColor: isDark ? "#1c1c1c" : "#fff" },
            ]}
          >
            <MaterialIcons name="memory" size={24} color="#8b5cf6" />
            <Text
              style={[
                styles.healthLabel,
                { color: isDark ? "#a0b3bd" : "#617c89" },
              ]}
            >
              Firmware
            </Text>
            <Text
              style={[
                styles.healthValue,
                { color: isDark ? "#fff" : "#111" },
              ]}
            >
              {deviceInfo.firmwareVersion || "N/A"}
            </Text>
          </View>
        </View>

        {/* Demo Mode Info */}
        <View
          style={[
            styles.infoCard,
            { backgroundColor: isDark ? "#1c1c1c" : "#fff" },
          ]}
        >
          <MaterialIcons name="info-outline" size={24} color="#3b82f6" />
          <View style={styles.infoContent}>
            <Text
              style={[styles.infoTitle, { color: isDark ? "#fff" : "#111" }]}
            >
              Demo Mode
            </Text>
            <Text
              style={[
                styles.infoDesc,
                { color: isDark ? "#a0b3bd" : "#617c89" },
              ]}
            >
              Test the app without hardware. Tap the play button above to start
              simulated sensor data.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },

  scrollContainer: {
    padding: 20,
  },

  statusCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },

  connectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  connectionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },

  connectionInfo: {
    flex: 1,
  },

  connectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },

  deviceName: {
    fontSize: 14,
  },

  actionButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  scanButton: {
    backgroundColor: "#13a4ec",
  },

  scanButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  disconnectButton: {
    backgroundColor: "#ef4444",
  },

  disconnectButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ef444420",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },

  errorText: {
    color: "#ef4444",
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    marginTop: 8,
  },

  sensorGrid: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },

  sensorCard: {
    flex: 1,
    alignItems: "center",
    padding: 8,
  },

  sensorName: {
    fontSize: 12,
    marginTop: 8,
    marginBottom: 4,
    textAlign: "center",
  },

  sensorValue: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },

  healthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },

  healthCard: {
    flex: 1,
    minWidth: "45%",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },

  healthLabel: {
    fontSize: 12,
    marginTop: 8,
    marginBottom: 4,
  },

  healthValue: {
    fontSize: 16,
    fontWeight: "bold",
  },

  infoCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },

  infoContent: {
    flex: 1,
    marginLeft: 12,
  },

  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },

  infoDesc: {
    fontSize: 13,
    lineHeight: 18,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },

  modalLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 12,
  },

  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e2e2e2",
  },

  modalHint: {
    fontSize: 12,
    marginTop: 12,
    fontStyle: "italic",
  },

  modalButtons: {
    flexDirection: "row",
    marginTop: 24,
    gap: 12,
  },

  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },

  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },

  connectButtonModal: {
    backgroundColor: "#13a4ec",
  },

  connectButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
