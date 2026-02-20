/**
 * Wearable Context
 * Global state management for ESP32 wearable device data and predictions
 * 
 * This context provides:
 * - Real-time sensor data from ESP32
 * - ML model predictions
 * - Device connection status
 * - Historical data access
 */

import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import ESP32WiFiService from '../services/ESP32WiFiService';
import MLModelService, { MIND_STATES } from '../services/MLModelService';
import StorageService from '../services/StorageService';

export const WearableContext = createContext();

// Default sensor values
const DEFAULT_SENSOR_DATA = {
  heartRate: 0,
  temperature: 0,
  eda: 0,
  timestamp: null,
};

// Default prediction
const DEFAULT_PREDICTION = {
  state: MIND_STATES.UNKNOWN,
  confidence: 0,
  calmScore: 50,
};

export const WearableProvider = ({ children }) => {
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [availableDevices, setAvailableDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [connectionError, setConnectionError] = useState(null);

  // Sensor data state
  const [sensorData, setSensorData] = useState(DEFAULT_SENSOR_DATA);
  const [sensorHistory, setSensorHistory] = useState([]);

  // Prediction state
  const [prediction, setPrediction] = useState(DEFAULT_PREDICTION);
  const [predictionHistory, setPredictionHistory] = useState([]);

  // Device info
  const [deviceInfo, setDeviceInfo] = useState({
    battery: null,
    lastSync: null,
  });

  // Model state
  const [isModelReady, setIsModelReady] = useState(false);
  const [modelError, setModelError] = useState(null);

  // Settings
  const [settings, setSettings] = useState({
    dataCollectionInterval: 5000,
    notificationsEnabled: true,
    stressAlertThreshold: 0.7,
  });

  // Refs
  const predictionIntervalRef = useRef(null);
  const isModelReadyRef = useRef(false);

  // ==================== INITIALIZATION ====================

  useEffect(() => {
    initializeServices();
    loadStoredData();

    return () => {
      cleanup();
    };
  }, []);

  const initializeServices = async () => {
    try {
      // Initialize WiFi service
      const wifiResult = await ESP32WiFiService.initialize();
      if (!wifiResult.success) {
        setConnectionError(wifiResult.error);
      }

      // Initialize ML model
      const mlResult = await MLModelService.initialize();
      if (mlResult.success) {
        const loadResult = await MLModelService.loadModel();
        const ready = loadResult.success || loadResult.usingFallback;
        setIsModelReady(ready);
        isModelReadyRef.current = ready;
        if (!loadResult.success && !loadResult.usingFallback) {
          setModelError(loadResult.error);
        }
      }

      // Set up WiFi callbacks
      ESP32WiFiService.setDataCallback(handleSensorData);
      ESP32WiFiService.setConnectionCallback(handleConnectionChange);
      ESP32WiFiService.setErrorCallback(handleWiFiError);
    } catch (error) {
      console.error('Service initialization error:', error);
      setConnectionError(error.message);
    }
  };

  const loadStoredData = async () => {
    try {
      // Load stored settings
      const storedSettings = await StorageService.getUserSettings();
      setSettings((prev) => ({ ...prev, ...storedSettings }));

      // Load today's predictions for history
      const todayPredictions = await StorageService.getTodayPredictions();
      setPredictionHistory(todayPredictions.slice(-50));

      // Load device info
      const storedDeviceInfo = await StorageService.getDeviceInfo();
      if (storedDeviceInfo) {
        setDeviceInfo(storedDeviceInfo);
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
    }
  };

  const cleanup = () => {
    if (predictionIntervalRef.current) {
      clearInterval(predictionIntervalRef.current);
    }
    ESP32WiFiService.destroy();
    MLModelService.dispose();
  };

  // ==================== BLE HANDLERS ====================

  const handleSensorData = useCallback(async (data) => {
    console.log('[WearableContext] Sensor data received:', {
      heartRate: data.heartRate,
      fingerDetected: data.fingerDetected,
      eda: data.eda,
      temperature: data.temperature,
    });

    // Update current sensor data
    setSensorData(data);

    // Add to history (keep last 100 readings in memory)
    setSensorHistory((prev) => [...prev.slice(-99), data]);

    // Save to storage
    await StorageService.saveSensorReading(data);

    // Only run prediction if finger is on sensor (valid heart rate)
    if (!data.fingerDetected) {
      console.log('[WearableContext] No finger detected — skipping prediction');
      // Reset prediction to unknown when no finger detected
      setPrediction(DEFAULT_PREDICTION);
      return;
    }

    // Make prediction (use ref to avoid stale closure)
    console.log('[WearableContext] Running prediction, modelReady:', isModelReadyRef.current);
    if (isModelReadyRef.current) {
      const result = await MLModelService.predict(data);
      console.log('[WearableContext] Prediction result:', result.state, 'confidence:', result.confidence);
      const calmScore = MLModelService.calculateCalmScore(result);

      const fullPrediction = {
        ...result,
        calmScore,
        sensorData: data,
      };

      setPrediction(fullPrediction);

      // Add to history
      setPredictionHistory((prev) => [...prev.slice(-49), fullPrediction]);

      // Save prediction
      await StorageService.savePrediction(fullPrediction);
    }
  }, []);

  const handleConnectionChange = useCallback((connected, device) => {
    setIsConnected(connected);
    setIsConnecting(false);

    if (connected && device) {
      setConnectedDevice({
        id: device.id,
        name: device.name,
      });
      setConnectionError(null);

      // Update stored device info
      StorageService.saveDeviceInfo({
        deviceId: device.id,
        name: device.name,
        isConnected: true,
        lastSync: new Date().toISOString(),
      });
    } else {
      setConnectedDevice(null);
    }
  }, []);

  const handleWiFiError = useCallback((error) => {
    console.error('WiFi Error:', error);
    setConnectionError(error.message);
  }, []);

  // ==================== CONNECTION METHODS ====================

  const scanForDevices = async () => {
    setIsScanning(true);
    setAvailableDevices([]);
    setConnectionError(null);

    try {
      const result = await ESP32WiFiService.scanForDevices();
      if (result.requiresManualIP) {
        // WiFi requires manual IP entry
        setConnectionError('Enter ESP32 IP address to connect');
      }
    } catch (error) {
      setConnectionError(error.message);
    } finally {
      setIsScanning(false);
    }
  };

  const stopScan = () => {
    setIsScanning(false);
  };

  const connectToDevice = async (deviceIdOrIP, port = 80) => {
    setIsConnecting(true);
    setConnectionError(null);

    try {
      const result = await ESP32WiFiService.connect(deviceIdOrIP, port);
      if (!result.success) {
        setConnectionError(result.error);
        setIsConnecting(false);
      }
      return result;
    } catch (error) {
      setConnectionError(error.message);
      setIsConnecting(false);
      return { success: false, error: error.message };
    }
  };

  const disconnectDevice = async () => {
    try {
      await ESP32WiFiService.disconnect();
      setIsConnected(false);
      setConnectedDevice(null);
      setSensorData(DEFAULT_SENSOR_DATA);
      setPrediction(DEFAULT_PREDICTION);
    } catch (error) {
      setConnectionError(error.message);
    }
  };

  // ==================== DATA METHODS ====================

  const refreshDeviceInfo = async () => {
    try {
      const info = await ESP32WiFiService.readDeviceInfo();
      if (info) {
        setDeviceInfo((prev) => ({
          ...prev,
          ...info,
          lastSync: new Date().toISOString(),
        }));
        await StorageService.saveDeviceInfo(info);
      }
    } catch (error) {
      console.error('Error refreshing device info:', error);
    }
  };

  const getTodayHistory = async () => {
    try {
      return await StorageService.getTodayPredictions();
    } catch (error) {
      console.error('Error getting today history:', error);
      return [];
    }
  };

  const getWeeklyStressData = async () => {
    try {
      return await StorageService.getStressEpisodesByDay(7);
    } catch (error) {
      console.error('Error getting weekly stress data:', error);
      return [];
    }
  };

  const getStateInfo = (state) => {
    return MLModelService.getStateInfo(state);
  };

  // ==================== SETTINGS METHODS ====================

  const updateSettings = async (newSettings) => {
    try {
      const updated = { ...settings, ...newSettings };
      setSettings(updated);
      await StorageService.saveUserSettings(updated);
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  // ==================== MOCK DATA (for testing without device) ====================

  const startMockDataStream = () => {
    console.log('Starting mock data stream...');
    
    predictionIntervalRef.current = setInterval(async () => {
      // Generate mock sensor data
      const mockData = {
        heartRate: 60 + Math.random() * 40, // 60-100 bpm
        fingerDetected: true, // Mock always assumes finger is on sensor
        temperature: 36 + Math.random() * 1.5, // 36-37.5°C
        eda: 0.5 + Math.random() * 5, // 0.5-5.5 microsiemens
        timestamp: new Date().toISOString(),
      };

      // Simulate occasional stress
      if (Math.random() < 0.1) {
        mockData.heartRate = 100 + Math.random() * 30;
        mockData.eda = 5 + Math.random() * 5;
      }

      handleSensorData(mockData);
    }, settings.dataCollectionInterval);

    setIsConnected(true);
    setConnectedDevice({ id: 'mock-device', name: 'Mock ESP32 Device' });
  };

  const stopMockDataStream = () => {
    if (predictionIntervalRef.current) {
      clearInterval(predictionIntervalRef.current);
      predictionIntervalRef.current = null;
    }
    setIsConnected(false);
    setConnectedDevice(null);
  };

  // ==================== CONTEXT VALUE ====================

  const contextValue = {
    // Connection state
    isConnected,
    isConnecting,
    isScanning,
    availableDevices,
    connectedDevice,
    connectionError,

    // Sensor data
    sensorData,
    sensorHistory,

    // Predictions
    prediction,
    predictionHistory,

    // Device info
    deviceInfo,

    // Model state
    isModelReady,
    modelError,

    // Settings
    settings,

    // Methods
    scanForDevices,
    stopScan,
    connectToDevice,
    disconnectDevice,
    refreshDeviceInfo,
    getTodayHistory,
    getWeeklyStressData,
    getStateInfo,
    updateSettings,

    // Mock data methods (for testing)
    startMockDataStream,
    stopMockDataStream,
  };

  return (
    <WearableContext.Provider value={contextValue}>
      {children}
    </WearableContext.Provider>
  );
};

export { MIND_STATES };
