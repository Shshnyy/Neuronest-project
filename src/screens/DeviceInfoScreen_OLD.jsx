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

  // Calculate last sync time display
  const getLastSyncDisplay = () => {
    if (!deviceInfo.lastSync) return "Never";
    const lastSync = new Date(deviceInfo.lastSync);
    const now = new Date();
    const diffMs = now - lastSync;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    return lastSync.toLocaleDateString();
  };

  // Sensor status based on connection and data
  const getSensorStatus = (sensorType) => {
    if (!isConnected) return { status: "Inactive", color: "#6b7280" };
    
    switch (sensorType) {
      case "heartRate":
        return sensorData.heartRate > 0
          ? { status: "Active", color: "#22c55e" }
          : { status: "Waiting", color: "#f59e0b" };
      case "temperature":
        return sensorData.temperature > 0
          ? { status: "Active", color: "#22c55e" }
          : { status: "Waiting", color: "#f59e0b" };
      case "eda":
        return sensorData.eda > 0
          ? { status: "Active", color: "#22c55e" }
          : { status: "Waiting", color: "#f59e0b" };
      default:
        return { status: "Unknown", color: "#6b7280" };
    }
  };

  const sensors = [
    {
      name: "Heart Rate Sensor",
      icon: "heart-pulse",
      key: "heartRate",
      value: sensorData.heartRate ? `${Math.round(sensorData.heartRate)} bpm` : "--",
    },
    {
      name: "Temperature Sensor",
      icon: "thermometer",
      key: "temperature",
      value: sensorData.temperature ? `${sensorData.temperature.toFixed(1)}°C` : "--",
    },
    {
      name: "EDA/GSR Sensor",
      icon: "pulse",
      key: "eda",
      value: sensorData.eda ? `${sensorData.eda.toFixed(2)} μS` : "--",
    },
  ];// WiFi mode - show IP input modal
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
        Alert.alert("Success", `Connected to ${ipAddress}:${portNum}`
      const result = await connectToDevice(deviceId);
      if (!result.success) {
        Alert.alert("Connection Failed", result.error);
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshDeviceInfo();
    setRefreshing(false);
  };

  // Demo mode toggle
  const handleDemoMode = () => {
    if (isConnected && connectedDevice?.id === "mock-device") {
      stopMockDataStream();
    } else {
      Alert.alert(
        "Demo Mode",
        "Start demo mode to test the app with simulated sensor data?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Start Demo",
            onPress: startMockDataStream,
          },
        ]
      );
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
            name="arrow-back"
            size={24}
            color={isDark ? "#fff" : "#111"}
          />
        </TouchableOpacity>
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
      >wifi" : "wifi-off
        {/* Connection Status Card */}
        <View
          style={[
            styles.connectionCard,
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
                name={isConnected ? "bluetooth-connected" : "bluetooth-disabled"}
                size={32}
                color={isConnected ? "#22c55e" : "#ef4444"}
              />
            </View>
            <View style={styles.connectionInfo}>
              <Text
                style={[
                  styles.connectionStatus,
                  { color: isConnected ? "#22c55e" : "#ef4444" },
                ]}
              >
                {isConnected ? "Connected" : "Disconnected"}
              </Text>
              {connectedDevice && (
                <Text
                  style={[
                    styles.deviceName,
                    { color: isDark ? "#a0b3bd" : "#617c89" },
                  ]}
                >
                  {connectedDevice.name}
                </Text>handleScan}
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
          transparent={true}!showIPModal && (
          <View style={styles.errorBanner}>
            <MaterialIcons name="error-outline" size={20} color="#ef4444" />
            <Text style={styles.errorText}>{connectionError}</Text>
          </View>
        )}

        {/* Available Devices List - Not used in WiFi mode */}
        {!isConnected && availableDevices.length > 0 && false" : "#fff" },
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
- Not used in WiFi mode */}
        {isScanning && availableDevices.length === 0 && false
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
        </Modal(
            <TouchableOpacity
              style={[styles.actionButton, styles.scanButton]}
              onPress={isScanning ? stopScan : handleScan}
              disabled={isConnecting}
            >
              {isScanning || isConnecting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.scanButtonText}>
                  {isScanning ? "Stop Scan" : "Scan for Devices"}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Error Message */}
        {connectionError && (
          <View style={styles.errorBanner}>
            <MaterialIcons name="error-outline" size={20} color="#ef4444" />
            <Text style={styles.errorText}>{connectionError}</Text>
          </View>
        )}

        {/* Available Devices List */}
        {!isConnected && availableDevices.length > 0 && (
          <>
            <Text
              style={[
                styles.sectionTitle,
                { color: isDark ? "#fff" : "#111" },
              ]}
            >
              Available Devices
            </Text>
            <View
              style={[
                styles.devicesList,
                { backgroundColor: isDark ? "#1c1c1c" : "#fff" },
              ]}
            >
              {availableDevices.map((device) => (
                <TouchableOpacity
                  key={device.id}
                  style={styles.deviceItem}
                  onPress={() => handleConnect(device.id)}
                  disabled={isConnecting}
                >
                  <View style={styles.deviceItemLeft}>
                    <MaterialIcons
                      name="bluetooth"
                      size={24}
                      color="#13a4ec"
                    />
                    <View style={styles.deviceItemInfo}>
                      <Text
                        style={[
                          styles.deviceItemName,
                          { color: isDark ? "#fff" : "#111" },
                        ]}
                      >
                        {device.name}
                      </Text>
                      <Text
                        style={[
                          styles.deviceItemId,
                          { color: isDark ? "#a0b3bd" : "#617c89" },
                        ]}
                      >
                        Signal: {device.rssi} dBm
                      </Text>
                    </View>
                  </View>
                  <MaterialIcons
                    name="chevron-right"
                    size={24}
                    color={isDark ? "#a0b3bd" : "#617c89"}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Scanning Indicator */}
        {isScanning && availableDevices.length === 0 && (
          <View style={styles.scanningIndicator}>
            <ActivityIndicator size="large" color="#13a4ec" />
            <Text
              style={[
                styles.scanningText,
                { color: isDark ? "#a0b3bd" : "#617c89" },
              ]}
            >
              Scanning for NeuroNest devices...
            </Text>
          </View>
        )}

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
              {deviceInfo.battery ? `${deviceInfo.battery}%` : "--"}
            </Text>
          </View>
          <View
            style={[
              styles.healthCard,
              { backgroundColor: isDark ? "#1c1c1c" : "#fff" },
            ]}
          >
            <Text name="wifi" size={24} color="#13a4ec" />
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
        </View>

        {/* Sensors */}
        <Text
          style={[
            styles.sectionTitle,
            { color: isDark ? "#fff" : "#111", marginTop: 24 },
          ]}
        >
          Sensors
        </Text>

        <View style={styles.sensorsGrid}>
          {sensors.map((sensor) => {
            const status = getSensorStatus(sensor.key);
            return (
              <View
                key={sensor.name}
                style={[
                  styles.sensorCard,
                  { backgroundColor: isDark ? "#1c1c1c" : "#fff" },
                ]}
              >
                <MaterialCommunityIcons
                  name={sensor.icon}
                  size={32}
                  color="#13a4ec"
                />
                <Text
                  style={[
                    styles.sensorName,
                    { color: isDark ? "#fff" : "#111" },
                  ]}
                >
                  {sensor.name}
                </Text>
                <Text
                  style={[
                    styles.sensorValue,
                    { color: isDark ? "#a0b3bd" : "#617c89" },
                  ]}
                >
                  {sensor.value}
                </Text>
                <View style={styles.statusBadge}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: status.color },
                    ]}
                  />
                  <Text style={[styles.statusText, { color: status.color }]}>
                    {status.status}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* ESP32 Info */}
        <View
          style={[
            styles.infoCard,
            { backgroundColor: isDark ? "#1c1c1c" : "#fff" },
          ]}
        >
          <MaterialCommunityIcons
            name="chip"
            size={24}
            color="#13a4ec"
          />
          <View style={styles.infoContent}>
            <Text
              style={[
                styles.infoTitle,
                { color: isDark ? "#fff" : "#111" },
              ]}
            >
              ESP32 Wearable
            </Text>
            <Text
              style={[
                styles.infoDesc,
                { color: isDark ? "#a0b3bd" : "#617c89" },
              ]}
            >
              Communicates via Bluetooth Low Energy (BLE). Ensure Bluetooth is
              enabled on your device.
            </Text>
          </View>
        </View>
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

  scrollContainer: { padding: 16, paddingBottom: 60 },

  connectionCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
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
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },

  connectionInfo: {
    flex: 1,
  },

  connectionStatus: {
    fontSize: 18,
    fontWeight: "bold",
  },

  deviceName: {
    fontSize: 14,
    marginTop: 4,
  },

  actionButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  scanButton: {
    backgroundColor: "#13a4ec",
  },

  scanButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  disconnectButton: {
    backgroundColor: "#ef444420",
    borderWidth: 1,
    borderColor: "#ef4444",
  },

  disconnectButtonText: {
    color: "#ef4444",
    fontWeight: "bold",
    fontSize: 16,
  },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    marginBottom: 16,
  },

  errorText: {
    marginLeft: 8,
    color: "#ef4444",
    fontSize: 14,
    flex: 1,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },

  devicesList: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
  },

  deviceItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e2e2",
  },

  deviceItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  deviceItemInfo: {
    marginLeft: 12,
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

  deviceItemName: {
    fontSize: 16,
    fontWeight: "600",
  },

  deviceItemId: {
    fontSize: 12,
    marginTop: 2,
  },

  scanningIndicator: {
    alignItems: "center",
    padding: 32,
  },

  scanningText: {
    marginTop: 12,
    fontSize: 14,
  },

  healthGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },

  healthCard: {
    width: "32%",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },

  healthLabel: {
    fontSize: 12,
    marginBottom: 4,
  },

  healthValue: {
    fontSize: 14,
    fontWeight: "bold",
  },

  sensorsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  sensorCard: {
    width: "48%",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
  },

  sensorName: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 8,
    textAlign: "center",
  },

  sensorValue: {
    fontSize: 12,
    marginTop: 4,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },

  infoCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    alignItems: "flex-start",
  },

  infoContent: {
    flex: 1,
    marginLeft: 12,
  },

  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },

  infoDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
});
