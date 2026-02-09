/**
 * Configuration Manager
 * Manages runtime configuration with AsyncStorage persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import AppConfig from '../config/appConfig';

class ConfigManager {
  constructor() {
    this.config = { ...AppConfig };
    this.configKey = AppConfig.storage.keys.esp32Config;
  }

  /**
   * Load saved configuration from AsyncStorage
   */
  async loadConfig() {
    try {
      const savedConfig = await AsyncStorage.getItem(this.configKey);
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        // Merge saved config with defaults
        this.config = {
          ...AppConfig,
          esp32: {
            ...AppConfig.esp32,
            ...parsed.esp32,
          },
        };
        return this.config;
      }
      return this.config;
    } catch (error) {
      console.error('[ConfigManager] Error loading config:', error);
      return this.config;
    }
  }

  /**
   * Save configuration to AsyncStorage
   */
  async saveConfig(updates) {
    try {
      this.config = {
        ...this.config,
        ...updates,
      };
      await AsyncStorage.setItem(this.configKey, JSON.stringify(this.config));
      return { success: true };
    } catch (error) {
      console.error('[ConfigManager] Error saving config:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update ESP32 connection settings
   */
  async updateESP32Config(ipAddress, port) {
    try {
      const updatedConfig = {
        esp32: {
          ...this.config.esp32,
          defaultIP: ipAddress,
          defaultPort: port,
        },
      };
      await this.saveConfig(updatedConfig);
      return { success: true };
    } catch (error) {
      console.error('[ConfigManager] Error updating ESP32 config:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get ESP32 connection URL
   */
  getESP32BaseURL(ipAddress = null, port = null) {
    const ip = ipAddress || this.config.esp32.defaultIP;
    const p = port || this.config.esp32.defaultPort;
    return `http://${ip}:${p}`;
  }

  /**
   * Get full endpoint URL
   */
  getEndpointURL(endpoint, ipAddress = null, port = null) {
    const baseURL = this.getESP32BaseURL(ipAddress, port);
    const path = this.config.esp32.endpoints[endpoint] || endpoint;
    return `${baseURL}${path}`;
  }

  /**
   * Get current ESP32 IP address
   */
  getESP32IP() {
    return this.config.esp32.defaultIP;
  }

  /**
   * Get current ESP32 port
   */
  getESP32Port() {
    return this.config.esp32.defaultPort;
  }

  /**
   * Get polling interval
   */
  getPollingInterval() {
    return this.config.esp32.pollingInterval;
  }

  /**
   * Get connection timeout
   */
  getConnectionTimeout() {
    return this.config.esp32.connectionTimeout;
  }

  /**
   * Get ML thresholds
   */
  getMLThresholds() {
    return this.config.mlModel.thresholds;
  }

  /**
   * Get storage settings
   */
  getStorageSettings() {
    return this.config.storage;
  }

  /**
   * Reset to default configuration
   */
  async resetToDefaults() {
    try {
      await AsyncStorage.removeItem(this.configKey);
      this.config = { ...AppConfig };
      return { success: true };
    } catch (error) {
      console.error('[ConfigManager] Error resetting config:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all configuration
   */
  getAllConfig() {
    return this.config;
  }
}

// Singleton instance
const configManager = new ConfigManager();
export default configManager;
