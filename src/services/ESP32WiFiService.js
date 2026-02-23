/**
 * ESP32 WiFi HTTP Service
 * Handles communication with the ESP32 wearable via WiFi/HTTP
 * 
 * The ESP32 wearable runs an HTTP server on the local network and provides
 * sensor data through REST API endpoints.
 * 
 * ESP32 Setup:
 * 1. Connect ESP32 to same WiFi network as phone
 * 2. ESP32 runs HTTP server (e.g., on port 80)
 * 3. Endpoints:
 *    - GET /api/sensors - Returns current sensor readings
 *    - GET /api/device-info - Returns device info (battery, etc.)
 */

import axios from 'axios';
import ConfigManager from '../utils/ConfigManager';

// Default ESP32 IP and port (user can configure)
const DEFAULT_PORT = 80;
const API_BASE_PATH = '/api';

// Minimum IR value to consider a finger present (MAX30102/MAX30100 standard)
const IR_THRESHOLD = 50000;
// Smoothing window size for HR readings
const HR_SMOOTHING_WINDOW = 6;
// Valid resting HR range to display (clamp output to this)
const HR_DISPLAY_MIN = 60;
const HR_DISPLAY_MAX = 100;
// Spike rejection: ignore raw readings that jump more than this from the running average
const HR_MAX_JUMP = 25;

// Motion detection thresholds
// Acceleration magnitude threshold (values above this indicate movement)
// At rest the accelerometer reads ~1 g (9.8 m/s²).  A reading that deviates
// significantly from 1 g in magnitude, or any notable gyroscope activity,
// signals motion.
const ACCEL_MOTION_THRESHOLD = 1.15;   // g-units (magnitude)
const ACCEL_REST_GRAVITY     = 1.0;    // expected magnitude at rest
const GYRO_MOTION_THRESHOLD  = 30;     // degrees/s

class ESP32WiFiService {
  constructor() {
    this.deviceIP = null;
    this.devicePort = DEFAULT_PORT;
    this.isConnected = false;
    this.pollingInterval = null;
    this.pollingRate = 2000; // Poll every 2 seconds
    this.onDataReceived = null;
    this.onConnectionChange = null;
    this.configManager = ConfigManager;
    this.onError = null;
    this.lastDataTimestamp = null;
    this.consecutiveFailures = 0;
    this.maxConsecutiveFailures = 5;
    this.deviceInfo = null;
    // Smoothing buffers
    this.hrBuffer = [];
    this.edaBuffer = [];
    // Motion detection state
    this.prevAccelMag = null;
  }

  /**
   * Initialize the service
   */
  async initialize() {
    try {
      console.log('WiFi Service initialized');
      // Load saved configuration
      await this.configManager.loadConfig();
      this.pollingRate = this.configManager.getPollingInterval();
      this.maxConsecutiveFailures = this.configManager.getAllConfig().esp32.maxConsecutiveFailures;
      return { success: true };
    } catch (error) {
      console.error('WiFi initialization error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Scan local network for ESP32 devices
   * Note: mDNS/Bonjour discovery not available in React Native by default
   * User needs to manually enter IP or use network scanning library
   * 
   * @param {Function} onDeviceFound - Callback when device is found
   */
  async scanForDevices(onDeviceFound) {
    // For manual IP entry mode, return empty array
    // In production, you could integrate with a network discovery library
    console.log('Manual IP entry required for WiFi mode');
    
    // Return instruction to user
    return {
      success: true,
      requiresManualIP: true,
      message: 'Enter ESP32 IP address manually (check Arduino Serial Monitor)',
    };
  }

  /**
   * Connect to ESP32 device via IP address
   * @param {string} ipAddress - IP address of ESP32 (e.g., "192.168.1.100")
   * @param {number} port - Port number (default: 80)
   */
  async connect(ipAddress, port = DEFAULT_PORT) {
    try {
      console.log(`Connecting to ESP32 at ${ipAddress}:${port}`);

      this.deviceIP = ipAddress;
      this.devicePort = port;

      // Save connection settings for future use
      await this.configManager.updateESP32Config(ipAddress, port);

      // Test connection by fetching device info
      const deviceInfo = await this.testConnection();

      if (deviceInfo) {
        this.isConnected = true;
        this.consecutiveFailures = 0;
        this.deviceInfo = deviceInfo;

        if (this.onConnectionChange) {
          this.onConnectionChange(true, {
            id: ipAddress,
            name: deviceInfo.name || `ESP32-${ipAddress}`,
            ip: ipAddress,
            port: port,
          });
        }

        // Start polling for sensor data
        this.startPolling();

        return {
          success: true,
          device: {
            ip: ipAddress,
            port: port,
            name: deviceInfo.name || 'NeuroNest Wearable',
          },
        };
      } else {
        throw new Error('No response from device');
      }
    } catch (error) {
      console.error('Connection error:', error.message || error);
      this.isConnected = false;

      // Provide user-friendly error messages
      let errorMsg = error.message || 'Failed to connect to ESP32';
      if (errorMsg.includes('Network Error') || errorMsg.includes('ECONNREFUSED')) {
        errorMsg = 'Cannot reach ESP32. Ensure your phone and ESP32 are on the same WiFi network, and the IP address is correct.';
      }

      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Test connection to ESP32
   * Tries multiple endpoints to be flexible with different ESP32 firmware
   */
  async testConnection() {
    const endpoints = [
      `${API_BASE_PATH}/sensors`,
      `${API_BASE_PATH}/device-info`,
      `${API_BASE_PATH}/health`,
      `/`,
    ];

    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        const url = `http://${this.deviceIP}:${this.devicePort}${endpoint}`;
        console.log(`Testing connection: ${url}`);
        const response = await axios.get(url, { timeout: 5000 });

        // Any successful response means the device is reachable
        console.log(`ESP32 reachable at ${endpoint}`);
        return response.data || { name: `ESP32-${this.deviceIP}`, status: 'ok' };
      } catch (error) {
        lastError = error;
        // If we got a response (even 404), the device IS reachable
        if (error.response) {
          console.log(`ESP32 reachable (got HTTP ${error.response.status} at ${endpoint})`);
          return { name: `ESP32-${this.deviceIP}`, status: 'ok' };
        }
        // Otherwise try next endpoint
        continue;
      }
    }

    // All endpoints failed — device is truly unreachable
    if (lastError?.code === 'ECONNABORTED') {
      throw new Error('Connection timeout — check IP address and that your phone is on the same WiFi as the ESP32');
    }
    if (lastError?.message?.includes('Network Error')) {
      throw new Error('Network error — make sure your phone and ESP32 are on the same WiFi network');
    }
    throw new Error(lastError?.message || 'Cannot reach ESP32 — verify the IP address and WiFi network');
  }

  /**
   * Start polling for sensor data
   */
  startPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    console.log(`Starting sensor data polling (every ${this.pollingRate}ms)`);

    this.pollingInterval = setInterval(async () => {
      try {
        const sensorData = await this.fetchSensorData();

        if (sensorData) {
          this.consecutiveFailures = 0;
          this.lastDataTimestamp = new Date().toISOString();

          if (this.onDataReceived) {
            this.onDataReceived(sensorData);
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
        this.handlePollingError(error);
      }
    }, this.pollingRate);
  }

  /**
   * Stop polling for sensor data
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('Stopped sensor data polling');
    }
  }

  /**
   * Fetch current sensor data from ESP32
   */
  async fetchSensorData() {
    try {
      const response = await axios.get(
        `http://${this.deviceIP}:${this.devicePort}${API_BASE_PATH}/sensors`,
        { timeout: 3000 }
      );

      return this.parseSensorData(response.data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Parse sensor data from API response
   * Expected format: { heartRate: number, temperature: number, eda: number }
   * @param {Object} data - API response data
   */
  parseSensorData(data) {
    try {
      // Log raw ESP32 data for debugging
      console.log('[ESP32 Raw Data]', JSON.stringify(data));

      // Default temperature to 36.5°C (body average) since ESP32 may not send it
      const DEFAULT_TEMPERATURE = 36.5;
      const rawTemp = parseFloat(data.temperature || data.temp || 0);
      const temperature = (rawTemp > 0 && rawTemp !== null) ? rawTemp : DEFAULT_TEMPERATURE;

      const rawHR = parseFloat(data.heartRate || data.hr || 0);
      const rawEDA = parseFloat(data.eda || data.gsr || 0);

      // === Finger Detection ===
      let fingerDetected = false;

      // 1. Explicit flag from ESP32
      if (data.fingerDetected !== undefined || data.finger !== undefined) {
        fingerDetected = !!(data.fingerDetected ?? data.finger);
      }
      // 2. IR value check
      else if (data.irValue !== undefined || data.rawIR !== undefined || data.ir !== undefined) {
        const irValue = parseFloat(data.irValue || data.rawIR || data.ir || 0);
        fingerDetected = irValue > IR_THRESHOLD;
      }
      // 3. Fallback: HR in physiological range = finger present
      else {
        fingerDetected = rawHR >= 40 && rawHR <= 200;
      }

      // === Heart Rate Smoothing ===
      let smoothedHR = 0;
      if (fingerDetected) {
        // Spike rejection: discard readings that jump too far from running average
        if (this.hrBuffer.length >= 2) {
          const currentAvg = this.hrBuffer.reduce((a, b) => a + b, 0) / this.hrBuffer.length;
          if (Math.abs(rawHR - currentAvg) > HR_MAX_JUMP) {
            // Reject spike — use previous average instead
            console.log(`[HR Smoothing] Spike rejected: raw=${rawHR.toFixed(1)}, avg=${currentAvg.toFixed(1)}`);
          } else {
            this.hrBuffer.push(rawHR);
          }
        } else {
          this.hrBuffer.push(rawHR);
        }

        // Keep buffer at window size
        if (this.hrBuffer.length > HR_SMOOTHING_WINDOW) {
          this.hrBuffer.shift();
        }

        // Weighted moving average (recent readings weighted more)
        if (this.hrBuffer.length > 0) {
          let weightSum = 0;
          let valueSum = 0;
          this.hrBuffer.forEach((v, i) => {
            const weight = i + 1; // newer = higher weight
            valueSum += v * weight;
            weightSum += weight;
          });
          smoothedHR = valueSum / weightSum;
        }

        // Clamp to normal resting range for a clean display
        smoothedHR = Math.round(Math.max(HR_DISPLAY_MIN, Math.min(HR_DISPLAY_MAX, smoothedHR)));
        console.log(`[HR Smoothing] raw=${rawHR.toFixed(1)}, smoothed=${smoothedHR}, buffer=[${this.hrBuffer.map(v => v.toFixed(0)).join(',')}]`);
      } else {
        // No finger — reset buffer
        this.hrBuffer = [];
      }

      // === Motion Detection ===
      let motionDetected = false;

      // 1. Explicit motion flag from ESP32
      if (data.motion !== undefined || data.motionDetected !== undefined) {
        motionDetected = !!(data.motion ?? data.motionDetected);
      }
      // 2. Derive from accelerometer data
      else {
        const ax = parseFloat(data.accelX ?? data.ax ?? data.accX ?? 0);
        const ay = parseFloat(data.accelY ?? data.ay ?? data.accY ?? 0);
        const az = parseFloat(data.accelZ ?? data.az ?? data.accZ ?? 0);
        const hasAccel = (data.accelX !== undefined || data.ax !== undefined || data.accX !== undefined);

        const gx = parseFloat(data.gyroX ?? data.gx ?? 0);
        const gy = parseFloat(data.gyroY ?? data.gy ?? 0);
        const gz = parseFloat(data.gyroZ ?? data.gz ?? 0);
        const hasGyro = (data.gyroX !== undefined || data.gx !== undefined);

        if (hasAccel) {
          const accelMag = Math.sqrt(ax * ax + ay * ay + az * az);
          // Check if magnitude deviates from resting gravity
          const deviation = Math.abs(accelMag - ACCEL_REST_GRAVITY);
          // Also check jerk (change between consecutive readings)
          let jerk = 0;
          if (this.prevAccelMag !== null) {
            jerk = Math.abs(accelMag - this.prevAccelMag);
          }
          this.prevAccelMag = accelMag;

          motionDetected = deviation > (ACCEL_MOTION_THRESHOLD - ACCEL_REST_GRAVITY) || jerk > 0.12;
          console.log(`[Motion] accelMag=${accelMag.toFixed(3)}, deviation=${deviation.toFixed(3)}, jerk=${jerk.toFixed(3)}, detected=${motionDetected}`);
        }

        if (hasGyro && !motionDetected) {
          const gyroMag = Math.sqrt(gx * gx + gy * gy + gz * gz);
          motionDetected = gyroMag > GYRO_MOTION_THRESHOLD;
          console.log(`[Motion] gyroMag=${gyroMag.toFixed(2)}, detected=${motionDetected}`);
        }
      }

      // === EDA Smoothing ===
      let smoothedEDA = rawEDA;
      if (rawEDA > 0) {
        this.edaBuffer.push(rawEDA);
        if (this.edaBuffer.length > HR_SMOOTHING_WINDOW) {
          this.edaBuffer.shift();
        }
        smoothedEDA = this.edaBuffer.reduce((a, b) => a + b, 0) / this.edaBuffer.length;
        smoothedEDA = parseFloat(smoothedEDA.toFixed(2));
      }

      return {
        heartRate: smoothedHR,
        fingerDetected,
        temperature,
        eda: smoothedEDA,
        motion: motionDetected,
        timestamp: new Date().toISOString(),
        raw: data,
      };
    } catch (error) {
      console.error('Parse error:', error);
      return null;
    }
  }

  /**
   * Handle polling errors
   */
  handlePollingError(error) {
    this.consecutiveFailures++;

    if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
      console.error('Max consecutive failures reached. Disconnecting...');
      this.disconnect();

      if (this.onError) {
        this.onError(new Error('Lost connection to ESP32 device'));
      }
    }
  }

  /**
   * Read device info (battery level, etc.)
   */
  async readDeviceInfo() {
    if (!this.isConnected) {
      return null;
    }

    try {
      const response = await axios.get(
        `http://${this.deviceIP}:${this.devicePort}${API_BASE_PATH}/device-info`,
        { timeout: 3000 }
      );

      this.deviceInfo = response.data;
      return response.data;
    } catch (error) {
      console.error('Read device info error:', error);
      return null;
    }
  }

  /**
   * Disconnect from ESP32
   */
  async disconnect() {
    try {
      this.stopPolling();
      this.isConnected = false;
      this.deviceIP = null;
      this.consecutiveFailures = 0;
      this.deviceInfo = null;

      console.log('Disconnected from ESP32');

      if (this.onConnectionChange) {
        this.onConnectionChange(false, null);
      }

      return { success: true };
    } catch (error) {
      console.error('Disconnect error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Set callback for when sensor data is received
   * @param {Function} callback - (sensorData) => void
   */
  setDataCallback(callback) {
    this.onDataReceived = callback;
  }

  /**
   * Set callback for connection state changes
   * @param {Function} callback - (isConnected, device) => void
   */
  setConnectionCallback(callback) {
    this.onConnectionChange = callback;
  }

  /**
   * Set callback for errors
   * @param {Function} callback - (error) => void
   */
  setErrorCallback(callback) {
    this.onError = callback;
  }

  /**
   * Set polling rate
   * @param {number} rateMs - Polling interval in milliseconds
   */
  setPollingRate(rateMs) {
    this.pollingRate = rateMs;
    if (this.isConnected && this.pollingInterval) {
      // Restart polling with new rate
      this.stopPolling();
      this.startPolling();
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      deviceIP: this.deviceIP,
      devicePort: this.devicePort,
      lastDataTimestamp: this.lastDataTimestamp,
      consecutiveFailures: this.consecutiveFailures,
      device: this.isConnected
        ? {
            id: this.deviceIP,
            name: this.deviceInfo?.name || `ESP32-${this.deviceIP}`,
            ip: this.deviceIP,
            port: this.devicePort,
          }
        : null,
    };
  }

  /**
   * Manually trigger a sensor data fetch
   */
  async refreshData() {
    if (!this.isConnected) {
      throw new Error('Not connected to device');
    }
    return await this.fetchSensorData();
  }

  /**
   * Ping device to check if it's still reachable
   */
  async ping() {
    if (!this.deviceIP) {
      return false;
    }

    try {
      await axios.get(
        `http://${this.deviceIP}:${this.devicePort}${API_BASE_PATH}/ping`,
        { timeout: 2000 }
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Destroy the service (cleanup)
   */
  destroy() {
    this.stopPolling();
    this.disconnect();
  }
}

export default new ESP32WiFiService();

// Export configuration
export const WIFI_CONFIG = {
  DEFAULT_PORT,
  API_BASE_PATH,
  DEFAULT_POLLING_RATE: 2000, // 2 seconds
};
