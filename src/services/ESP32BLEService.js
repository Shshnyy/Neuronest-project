/**
 * ESP32 Bluetooth Low Energy Service
 * Handles communication with the wearable device via BLE
 * 
 * The ESP32 wearable sends sensor data in the following format:
 * - Heart Rate (BPM)
 * - Temperature (Celsius)
 * - EDA/GSR (Electrodermal Activity - microsiemens)
 */

import { BleManager } from 'react-native-ble-plx';
import { Buffer } from 'buffer';

// UUIDs for the ESP32 BLE Service
// You should update these to match your ESP32 firmware configuration
const ESP32_SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const SENSOR_DATA_CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
const DEVICE_INFO_CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a9';

class ESP32BLEService {
  constructor() {
    this.manager = new BleManager();
    this.device = null;
    this.isScanning = false;
    this.isConnected = false;
    this.onDataReceived = null;
    this.onConnectionChange = null;
    this.onError = null;
    this.subscription = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  /**
   * Initialize the BLE manager and check permissions
   */
  async initialize() {
    try {
      // Check BLE state
      const state = await this.manager.state();
      
      if (state !== 'PoweredOn') {
        return {
          success: false,
          error: 'Bluetooth is not enabled. Please enable Bluetooth.',
          state,
        };
      }
      
      return { success: true, state };
    } catch (error) {
      console.error('BLE initialization error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Start scanning for ESP32 devices
   * @param {Function} onDeviceFound - Callback when device is found
   * @param {number} timeout - Scan timeout in ms (default 10000)
   */
  async startScan(onDeviceFound, timeout = 10000) {
    if (this.isScanning) {
      console.log('Already scanning...');
      return;
    }

    try {
      this.isScanning = true;
      const foundDevices = [];

      // Start scanning
      this.manager.startDeviceScan(
        [ESP32_SERVICE_UUID], // Filter by service UUID
        { allowDuplicates: false },
        (error, device) => {
          if (error) {
            console.error('Scan error:', error);
            this.isScanning = false;
            if (this.onError) this.onError(error);
            return;
          }

          if (device && device.name) {
            // Check if it's a NeuroNest device
            if (
              device.name.includes('NeuroNest') ||
              device.name.includes('ESP32') ||
              device.name.includes('Wearable')
            ) {
              const deviceInfo = {
                id: device.id,
                name: device.name,
                rssi: device.rssi,
              };
              
              if (!foundDevices.find((d) => d.id === device.id)) {
                foundDevices.push(deviceInfo);
                if (onDeviceFound) onDeviceFound(deviceInfo);
              }
            }
          }
        }
      );

      // Stop scanning after timeout
      setTimeout(() => {
        this.stopScan();
      }, timeout);

      return foundDevices;
    } catch (error) {
      console.error('Start scan error:', error);
      this.isScanning = false;
      throw error;
    }
  }

  /**
   * Stop scanning for devices
   */
  stopScan() {
    if (this.isScanning) {
      this.manager.stopDeviceScan();
      this.isScanning = false;
      console.log('Stopped scanning');
    }
  }

  /**
   * Connect to a specific ESP32 device
   * @param {string} deviceId - The device ID to connect to
   */
  async connect(deviceId) {
    try {
      this.stopScan();

      console.log(`Connecting to device: ${deviceId}`);
      
      // Connect to device
      this.device = await this.manager.connectToDevice(deviceId, {
        autoConnect: true,
        requestMTU: 512,
      });

      // Discover services and characteristics
      await this.device.discoverAllServicesAndCharacteristics();

      this.isConnected = true;
      this.reconnectAttempts = 0;

      // Set up disconnect listener
      this.device.onDisconnected((error, device) => {
        console.log('Device disconnected:', error?.message || 'No error');
        this.isConnected = false;
        if (this.onConnectionChange) {
          this.onConnectionChange(false, device);
        }
        
        // Attempt to reconnect
        this.attemptReconnect(deviceId);
      });

      if (this.onConnectionChange) {
        this.onConnectionChange(true, this.device);
      }

      // Start listening for sensor data
      await this.startDataNotifications();

      return { success: true, device: this.device };
    } catch (error) {
      console.error('Connection error:', error);
      this.isConnected = false;
      return { success: false, error: error.message };
    }
  }

  /**
   * Attempt to reconnect to the device
   * @param {string} deviceId 
   */
  async attemptReconnect(deviceId) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached');
      if (this.onError) {
        this.onError(new Error('Failed to reconnect after multiple attempts'));
      }
      return;
    }

    this.reconnectAttempts++;
    console.log(`Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

    // Wait before reconnecting
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      await this.connect(deviceId);
    } catch (error) {
      console.error('Reconnect failed:', error);
    }
  }

  /**
   * Start listening for sensor data notifications
   */
  async startDataNotifications() {
    if (!this.device || !this.isConnected) {
      throw new Error('Device not connected');
    }

    try {
      // Subscribe to sensor data characteristic
      this.subscription = this.device.monitorCharacteristicForService(
        ESP32_SERVICE_UUID,
        SENSOR_DATA_CHARACTERISTIC_UUID,
        (error, characteristic) => {
          if (error) {
            console.error('Notification error:', error);
            if (this.onError) this.onError(error);
            return;
          }

          if (characteristic?.value) {
            const sensorData = this.parseSensorData(characteristic.value);
            if (sensorData && this.onDataReceived) {
              this.onDataReceived(sensorData);
            }
          }
        }
      );

      console.log('Started sensor data notifications');
    } catch (error) {
      console.error('Failed to start notifications:', error);
      throw error;
    }
  }

  /**
   * Parse sensor data from BLE characteristic value
   * Expected format from ESP32: JSON string or binary data
   * Format: { heartRate: number, temperature: number, eda: number }
   * @param {string} base64Value - Base64 encoded data
   */
  parseSensorData(base64Value) {
    try {
      const decoded = Buffer.from(base64Value, 'base64').toString('utf-8');
      
      // Default temperature to 36.5°C (body average) since ESP32 may not send it
      const DEFAULT_TEMPERATURE = 36.5;

      // Helper: determine finger detection from data fields
      const detectFinger = (rawData, rawHR) => {
        // 1. Explicit flag from ESP32
        if (rawData.fingerDetected !== undefined || rawData.finger !== undefined) {
          return !!(rawData.fingerDetected ?? rawData.finger);
        }
        // 2. IR value check (MAX30102: > 50000 = finger present)
        if (rawData.irValue !== undefined || rawData.rawIR !== undefined || rawData.ir !== undefined) {
          const irValue = parseFloat(rawData.irValue || rawData.rawIR || rawData.ir || 0);
          return irValue > 50000;
        }
        // 3. Fallback: HR range check only
        return rawHR >= 40 && rawHR <= 200;
      };

      // Try parsing as JSON first
      try {
        const data = JSON.parse(decoded);
        const rawTemp = parseFloat(data.temperature || data.temp || 0);
        const rawHR = parseFloat(data.heartRate || data.hr || 0);
        const fingerDetected = detectFinger(data, rawHR);
        const heartRate = fingerDetected ? rawHR : 0;
        return {
          heartRate,
          fingerDetected,
          temperature: (rawTemp > 0) ? rawTemp : DEFAULT_TEMPERATURE,
          eda: parseFloat(data.eda || data.gsr || 0),
          timestamp: new Date().toISOString(),
          raw: data,
        };
      } catch {
        // If not JSON, try parsing as comma-separated values
        // Format: "heartRate,temperature,eda"
        const values = decoded.split(',').map((v) => parseFloat(v.trim()));
        if (values.length >= 3) {
          const csvTemp = values[1];
          const csvHR = values[0];
          const fingerDetected = csvHR >= 40 && csvHR <= 200;
          const heartRate = fingerDetected ? csvHR : 0;
          return {
            heartRate,
            fingerDetected,
            temperature: (csvTemp > 0) ? csvTemp : DEFAULT_TEMPERATURE,
            eda: values[2],
            timestamp: new Date().toISOString(),
            raw: decoded,
          };
        }
      }
      
      console.warn('Unable to parse sensor data:', decoded);
      return null;
    } catch (error) {
      console.error('Parse error:', error);
      return null;
    }
  }

  /**
   * Read device info (battery level, etc.)
   */
  async readDeviceInfo() {
    if (!this.device || !this.isConnected) {
      return null;
    }

    try {
      const characteristic = await this.device.readCharacteristicForService(
        ESP32_SERVICE_UUID,
        DEVICE_INFO_CHARACTERISTIC_UUID
      );

      if (characteristic?.value) {
        const decoded = Buffer.from(characteristic.value, 'base64').toString('utf-8');
        try {
          return JSON.parse(decoded);
        } catch {
          return { raw: decoded };
        }
      }
    } catch (error) {
      console.error('Read device info error:', error);
    }
    
    return null;
  }

  /**
   * Disconnect from the current device
   */
  async disconnect() {
    try {
      if (this.subscription) {
        this.subscription.remove();
        this.subscription = null;
      }

      if (this.device) {
        await this.device.cancelConnection();
        this.device = null;
      }

      this.isConnected = false;
      console.log('Disconnected from device');

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
   * Check if currently connected
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      isScanning: this.isScanning,
      device: this.device
        ? {
            id: this.device.id,
            name: this.device.name,
          }
        : null,
    };
  }

  /**
   * Destroy the BLE manager (cleanup)
   */
  destroy() {
    this.stopScan();
    this.disconnect();
    this.manager.destroy();
  }
}

export default new ESP32BLEService();

// Export UUIDs for configuration
export const BLE_CONFIG = {
  SERVICE_UUID: ESP32_SERVICE_UUID,
  SENSOR_DATA_UUID: SENSOR_DATA_CHARACTERISTIC_UUID,
  DEVICE_INFO_UUID: DEVICE_INFO_CHARACTERISTIC_UUID,
};
