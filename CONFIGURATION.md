# Configuration Guide

This app uses a centralized configuration system that allows you to easily manage ESP32 connection settings, ML thresholds, and other parameters.

## Configuration File

### appConfig.js
**Location:** `src/config/appConfig.js`

This is the **single source** of configuration for the entire app:

```javascript
{
  esp32: {
    defaultIP: "192.168.1.100",     // Your ESP32's IP address
    defaultPort: 80,                 // HTTP server port
    pollingInterval: 2000,           // How often to fetch data (ms)
    connectionTimeout: 5000,         // Connection timeout (ms)
    maxConsecutiveFailures: 5,       // Max failures before disconnect
  },
  
  mlModel: {
    enabled: true,
    confidenceThreshold: 0.6,
    thresholds: {
      heartRate: {
        calm: 80,      // Below = calm
        stressed: 90,  // Above = stressed  
        meltdown: 110, // Above = meltdown risk
      },
      eda: {
        calm: 6,
        stressed: 10,
        meltdown: 15,
      },
      temperature: {
        normal: 37.0,
        elevated: 37.5,
      },
    },
  },
  
  storage: {
    maxSensorReadings: 1000,
    maxPredictions: 500,
    maxStressEpisodes: 200,
  },
}
```

### ConfigManager
**Location:** `src/utils/ConfigManager.js`

Runtime configuration manager that:
- Loads/saves settings to AsyncStorage
- Persists user preferences
- Provides helper methods for accessing config

## Quick Configuration

### Update ESP32 IP Address

**Option 1: Edit appConfig.js (before building)**
```javascript
// src/config/appConfig.js
esp32: {
  defaultIP: "192.168.1.150",  // Change this
  defaultPort: 80,
}
```

**Option 2: Use the App UI (runtime)**
1. Open app → Device Info screen
2. Tap "Enter IP Address"
3. Enter new IP and port
4. Tap "Connect"
5. Settings are automatically saved

**Option 3: Programmatic (in code)**
```javascript
import ConfigManager from './src/utils/ConfigManager';

await ConfigManager.updateESP32Config("192.168.1.150", 80);
```

### Adjust ML Thresholds

**Edit thresholds in appConfig.js:**
```javascript
mlModel: {
  thresholds: {
    heartRate: {
      calm: 75,      // Lower = more sensitive
      stressed: 85,
      meltdown: 105,
    },
    eda: {
      calm: 5,       // Adjust based on your sensors
      stressed: 8,
      meltdown: 12,
    },
  },
}
```

**Effects:**
- **Lower thresholds** = More sensitive (detects stress earlier)
- **Higher thresholds** = Less sensitive (fewer false alerts)

### Change Polling Interval

```javascript
esp32: {
  pollingInterval: 1000,  // Poll every 1 second (faster)
  // OR
  pollingInterval: 5000,  // Poll every 5 seconds (battery saving)
}
```

**Trade-offs:**
- Faster polling = More responsive but higher battery/data usage
- Slower polling = Better battery life but less responsive

## Configuration API

### Get ESP32 URL
```javascript
import ConfigManager from './src/utils/ConfigManager';

// Load config first
await ConfigManager.loadConfig();

// Get base URL
const url = ConfigManager.getESP32BaseURL();
// Returns: "http://192.168.1.100:80"

// Get specific endpoint
const sensorsUrl = ConfigManager.getEndpointURL('sensors');
// Returns: "http://192.168.1.100:80/api/sensors"
```

### Get ML Thresholds
```javascript
const thresholds = ConfigManager.getMLThresholds();
console.log(thresholds.heartRate.stressed); // 90
```

### Save Custom Settings
```javascript
await ConfigManager.saveConfig({
  esp32: {
    defaultIP: "192.168.1.200",
    defaultPort: 8080,
    pollingInterval: 3000,
  }
});
```

### Reset to Defaults
```javascript
await ConfigManager.resetToDefaults();
```

## Where Settings Are Used

### ESP32WiFiService
- Uses `defaultIP` and `defaultPort` for connection
- Uses `pollingInterval` for data fetching
- Uses `connectionTimeout` for timeouts
- Auto-saves new IP when you connect via UI

### MLModelService
- Uses `mlModel.thresholds` for predictions
- Adjusts sensitivity based on your settings
- Falls back to defaults if config not loaded

### StorageService
- Uses `storage.maxSensorReadings` for data retention
- Auto-prunes old data based on limits

### DeviceInfoScreen
- Loads saved IP on startup
- Updates config when connecting to new IP

## Best Practices

### 1. Test Different Thresholds
Start with defaults, then adjust based on the child's baseline:
```javascript
// For a child with naturally higher heart rate
heartRate: {
  calm: 85,      // Instead of 80
  stressed: 95,  // Instead of 90
  meltdown: 115, // Instead of 110
}
```

### 2. Adjust for Sensor Sensitivity
Different EDA sensors have different ranges:
```javascript
// For less sensitive EDA sensor
eda: {
  calm: 8,      // Higher values
  stressed: 12,
  meltdown: 18,
}
```

### 3. Balance Responsiveness
```javascript
// Real-time monitoring
pollingInterval: 1000,  // 1 second

// Battery saving
pollingInterval: 5000,  // 5 seconds
```

### 4. Connection Reliability
```javascript
// Unstable network
connectionTimeout: 10000,        // 10 seconds
maxConsecutiveFailures: 10,      // More retries

// Stable network
connectionTimeout: 3000,         // 3 seconds
maxConsecutiveFailures: 3,       // Fewer retries
```

## Troubleshooting

### Config Not Loading
```javascript
// Check if config loaded
const config = await ConfigManager.loadConfig();
console.log('Config:', config);
```

### Reset Corrupted Config
```javascript
// Clear saved settings
await ConfigManager.resetToDefaults();
```

### Debug Current Settings
```javascript
// View all settings
const allConfig = ConfigManager.getAllConfig();
console.log(JSON.stringify(allConfig, null, 2));
```

## Configuration Priority

Settings are resolved in this order:

1. **Runtime changes** (via app UI)
2. **Saved settings** (from AsyncStorage)
3. **appConfig.js defaults**
4. **Hardcoded fallbacks** (in services)

Example:
```
User changes IP in app
   ↓
Saved to AsyncStorage
   ↓
Loaded on next app start
   ↓
Falls back to appConfig.js if AsyncStorage fails
   ↓
Falls back to hardcoded if appConfig fails
```

## Quick Reference

| Setting | File | Default | Purpose |
|---------|------|---------|---------|
| ESP32 IP | appConfig.js | 192.168.1.100 | Device address |
| Port | appConfig.js | 80 | HTTP port |
| Polling | appConfig.js | 2000ms | Data fetch rate |
| HR Stressed | appConfig.js | 90 BPM | Stress threshold |
| EDA Meltdown | appConfig.js | 15 µS | Meltdown threshold |
| Max Predictions | appConfig.js | 500 | History limit |

## Summary

✅ **One place** to configure everything: `appConfig.js`
✅ **Persistent** settings saved automatically
✅ **UI-based** configuration (no code changes needed)
✅ **Type-safe** with ConfigManager helpers
✅ **Flexible** - override at runtime or build time

Edit [src/config/appConfig.js](src/config/appConfig.js) and restart the app!
