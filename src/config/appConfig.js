/**
 * App Configuration
 * Centralized configuration for ESP32 connection and app settings
 */

const AppConfig = {
  // ESP32 WiFi Connection Settings
  esp32: {
    // Default IP address of your ESP32
    // Check Arduino Serial Monitor after uploading firmware
    defaultIP: "192.168.1.100",
    
    // Default HTTP port
    defaultPort: 80,
    
    // Polling interval in milliseconds (how often to fetch sensor data)
    pollingInterval: 2000,
    
    // Connection timeout in milliseconds
    connectionTimeout: 5000,
    
    // Maximum consecutive failures before disconnecting
    maxConsecutiveFailures: 5,
    
    // API endpoints (relative paths)
    endpoints: {
      sensors: "/api/sensors",
      deviceInfo: "/api/device-info",
      health: "/api/health",
    },
  },

  // ML Model Settings
  mlModel: {
    // Enable/disable ML predictions
    enabled: true,
    
    // Prediction confidence threshold (0-1)
    confidenceThreshold: 0.6,
    
    // Number of readings to smooth predictions
    smoothingWindow: 3,
    
    // Stress thresholds (based on WESAD dataset)
    thresholds: {
      heartRate: {
        calm: 80,      // Below this = calm
        stressed: 90,  // Above this = stressed
        meltdown: 110, // Above this = meltdown risk
      },
      eda: {
        calm: 6,       // Below this = calm
        stressed: 10,  // Above this = stressed
        meltdown: 15,  // Above this = meltdown risk
      },
      temperature: {
        normal: 37.0,  // Normal body temperature
        elevated: 37.5, // Elevated (stress indicator)
      },
    },
  },

  // Local Storage Settings
  storage: {
    // Maximum number of sensor readings to store
    maxSensorReadings: 1000,
    
    // Maximum number of predictions to store
    maxPredictions: 500,
    
    // Maximum number of stress episodes to store
    maxStressEpisodes: 200,
    
    // Keys for AsyncStorage
    keys: {
      sensorReadings: "@neuronest_sensor_readings",
      predictions: "@neuronest_predictions",
      stressEpisodes: "@neuronest_stress_episodes",
      esp32Config: "@neuronest_esp32_config",
    },
  },

  // Demo Mode Settings
  demo: {
    // Enable demo mode by default
    enabled: false,
    
    // Simulated sensor ranges
    heartRate: { min: 60, max: 100 },
    temperature: { min: 36.0, max: 37.5 },
    eda: { min: 2.0, max: 15.0 },
    
    // Update interval for demo data (ms)
    updateInterval: 2000,
  },

  // UI Settings
  ui: {
    // Refresh interval for real-time updates (ms)
    refreshInterval: 1000,
    
    // Chart data points to display
    chartDataPoints: 20,
    
    // Animation duration (ms)
    animationDuration: 300,
  },

  // App Metadata
  app: {
    name: "NeuroNest",
    version: "1.0.0",
    description: "Wearable monitoring for autistic children",
  },
};

export default AppConfig;
