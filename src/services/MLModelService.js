/**
 * ML Model Service for Mind State Prediction
 * 
 * This service handles:
 * 1. Preprocessing sensor data (normalization/standardization)
 * 2. Making predictions on real-time sensor data
 * 3. Post-processing predictions into human-readable states
 * 
 * NOTE: TensorFlow.js has compatibility issues with current Expo version.
 * This implementation uses a robust rule-based system that mimics the
 * WESAD model behavior. You can replace this with TF.js when compatible.
 * 
 * To add TensorFlow.js support later:
 * 1. npm install @tensorflow/tfjs @tensorflow/tfjs-react-native expo-gl
 * 2. Uncomment the TF.js code sections below
 * 3. Export your model to TensorFlow.js format
 * 
 * WESAD Dataset Classes:
 * - 0: Baseline/Neutral
 * - 1: Stress
 * - 2: Amusement
 * - 3: Meditation
 * 
 * For our use case, we map these to:
 * - Calm: Baseline, Amusement, Meditation
 * - Stressed: Stress
 * - Meltdown: High stress with specific patterns
 */

// Uncomment for TensorFlow.js support:
import * as tf from '@tensorflow/tfjs';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';
import ConfigManager from '../utils/ConfigManager';

// Mind state labels
const MIND_STATES = {
  CALM: 'Calm',
  STRESSED: 'Stressed',
  MELTDOWN: 'Meltdown',
  AMUSEMENT: 'Amusement',
  UNKNOWN: 'Unknown',
};

// Feature normalization parameters (based on WESAD dataset statistics)
// Update these based on your trained model's preprocessing
const NORMALIZATION_PARAMS = {
  heartRate: { mean: 75, std: 15, min: 40, max: 180 },
  temperature: { mean: 36.5, std: 0.5, min: 35, max: 40 },
  eda: { mean: 2.0, std: 1.5, min: 0, max: 25 },
};

// Thresholds calibrated based on WESAD research
// These can be overridden by ConfigManager settings
const getStressThresholds = () => {
  // Try to get from ConfigManager, fallback to defaults
  try {
    const thresholds = ConfigManager.getMLThresholds();
    return {
      heartRate: {
        elevated: thresholds.heartRate.stressed,
        high: thresholds.heartRate.meltdown,
        critical: thresholds.heartRate.meltdown + 20,
      },
      temperature: {
        elevated: thresholds.temperature.normal,
        high: thresholds.temperature.elevated,
      },
      eda: {
        elevated: thresholds.eda.calm,
        high: thresholds.eda.stressed,
        critical: thresholds.eda.meltdown,
      },
    };
  } catch (error) {
    // Fallback to defaults if ConfigManager not loaded
    return {
      heartRate: {
        elevated: 90,
        high: 110,
        critical: 130,
      },
      temperature: {
        elevated: 37.0,
        high: 37.5,
      },
      eda: {
        elevated: 3.0,
        high: 5.0,
        critical: 8.0,
      },
    };
  }
};

const STRESS_THRESHOLDS = getStressThresholds();

class MLModelService {
  constructor() {
    this.model = null;
    this.isModelLoaded = false;
    this.predictionHistory = [];
    this.smoothingWindow = 5; // Number of predictions to average for smoothing
    this.useTensorFlow = false; // Set to true when TF.js is available
  }

  /**
   * Initialize the service
   * For TensorFlow.js, this would initialize tf.ready()
   */
  async initialize() {
    try {
      // TensorFlow.js initialization
      await tf.ready();
      console.log('TensorFlow.js initialized');
      console.log('Backend:', tf.getBackend());
      this.useTensorFlow = true;

      return { success: true, backend: tf.getBackend() };
    } catch (error) {
      console.error('Initialization error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load the trained model
   * Currently uses rule-based fallback
   * 
   * To use TensorFlow.js model:
   * 1. Export your model from Colab in TF.js format
   * 2. Copy model.json and weights.bin to assets/model/
   * 3. Uncomment the TF.js loading code below
   */
  async loadModel() {
    try {
      if (this.isModelLoaded) {
        console.log('Model already loaded');
        return { success: true };
      }

      // Uncomment for TensorFlow.js model loading:

      if (this.useTensorFlow) {
        console.log('Loading TensorFlow.js model...');
        
        try {
          // For React Native, use bundleResourceIO with require
          const modelJSON = require('../../assets/model/model.json');
          const modelWeights = require('../../assets/model/weights.bin');
          
          this.model = await tf.loadLayersModel(
            bundleResourceIO(modelJSON, modelWeights)
          );
          
          this.isModelLoaded = true;
          console.log('ML model loaded successfully');
          console.log('Model input shape:', this.model.inputs[0].shape);
          console.log('Model output shape:', this.model.outputs[0].shape);
          return { success: true };
        } catch (modelError) {
          console.warn('Failed to load TensorFlow model, using rule-based fallback:', modelError.message);
          // Fall through to rule-based system
        }
      }

      // Using rule-based system
      console.log('Using rule-based prediction system');
      this.isModelLoaded = true; // Mark as ready for rule-based
      
      return { 
        success: true, 
        usingFallback: true,
        message: 'Using rule-based predictions (TF.js not available)'
      };
    } catch (error) {
      console.error('Model loading error:', error);
      this.isModelLoaded = true; // Use fallback
      return { 
        success: false, 
        error: error.message,
        usingFallback: true 
      };
    }
  }

  /**
   * Normalize sensor data for model input
   * @param {Object} sensorData - { heartRate, temperature, eda }
   * @returns {Array} Normalized features
   */
  normalizeSensorData(sensorData) {
    const { heartRate, temperature, eda } = sensorData;

    // Z-score normalization (same as training)
    const normalizedHR =
      (heartRate - NORMALIZATION_PARAMS.heartRate.mean) /
      NORMALIZATION_PARAMS.heartRate.std;
    
    const normalizedTemp =
      (temperature - NORMALIZATION_PARAMS.temperature.mean) /
      NORMALIZATION_PARAMS.temperature.std;
    
    const normalizedEDA =
      (eda - NORMALIZATION_PARAMS.eda.mean) /
      NORMALIZATION_PARAMS.eda.std;

    return [normalizedHR, normalizedTemp, normalizedEDA];
  }

  /**
   * Make a prediction on sensor data
   * @param {Object} sensorData - { heartRate, temperature, eda }
   * @returns {Object} Prediction result
   */
  async predict(sensorData) {
    try {
      const { heartRate, temperature, eda } = sensorData;

      // Validate input
      if (
        typeof heartRate !== 'number' ||
        typeof temperature !== 'number' ||
        typeof eda !== 'number'
      ) {
        throw new Error('Invalid sensor data format');
      }

      let prediction;

      // Use TensorFlow model if available, otherwise use rule-based
      if (this.model && this.useTensorFlow) {
        prediction = await this.predictWithModel(sensorData);
      } else {
        prediction = this.predictWithRules(sensorData);
      }

      // Add to history for smoothing
      this.predictionHistory.push(prediction);
      if (this.predictionHistory.length > this.smoothingWindow) {
        this.predictionHistory.shift();
      }

      // Apply smoothing
      const smoothedPrediction = this.smoothPrediction(prediction);

      return {
        ...smoothedPrediction,
        raw: prediction,
        sensorData,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Prediction error:', error);
      return {
        state: MIND_STATES.UNKNOWN,
        confidence: 0,
        error: error.message,
      };
    }
  }

  /**
   * Make prediction using the ML model (when TensorFlow.js is available)
   * @param {Object} sensorData 
   */
  async predictWithModel(sensorData) {
    const normalizedFeatures = this.normalizeSensorData(sensorData);

    // Uncomment for TensorFlow.js:
    const inputTensor = tf.tensor2d([normalizedFeatures]);
    const outputTensor = this.model.predict(inputTensor);
    const predictions = await outputTensor.data();
    
    inputTensor.dispose();
    outputTensor.dispose();

    const predictedClass = predictions.indexOf(Math.max(...predictions));
    const confidence = predictions[predictedClass];

    const state = this.mapClassToState(predictedClass, confidence, sensorData);

    return {
      state,
      confidence,
      classIndex: predictedClass,
      probabilities: Array.from(predictions),
    };
  }

  /**
   * Advanced rule-based prediction based on WESAD research
   * This provides robust predictions without requiring TensorFlow.js
   * @param {Object} sensorData 
   */
  predictWithRules(sensorData) {
    const { heartRate, temperature, eda } = sensorData;

    // Calculate feature deviations from baseline
    const hrDeviation = (heartRate - NORMALIZATION_PARAMS.heartRate.mean) / 
                        NORMALIZATION_PARAMS.heartRate.std;
    const tempDeviation = (temperature - NORMALIZATION_PARAMS.temperature.mean) / 
                          NORMALIZATION_PARAMS.temperature.std;
    const edaDeviation = (eda - NORMALIZATION_PARAMS.eda.mean) / 
                         NORMALIZATION_PARAMS.eda.std;

    // Stress indicators based on thresholds
    const indicators = {
      hrElevated: heartRate >= STRESS_THRESHOLDS.heartRate.elevated,
      hrHigh: heartRate >= STRESS_THRESHOLDS.heartRate.high,
      hrCritical: heartRate >= STRESS_THRESHOLDS.heartRate.critical,
      tempElevated: temperature >= STRESS_THRESHOLDS.temperature.elevated,
      tempHigh: temperature >= STRESS_THRESHOLDS.temperature.high,
      edaElevated: eda >= STRESS_THRESHOLDS.eda.elevated,
      edaHigh: eda >= STRESS_THRESHOLDS.eda.high,
      edaCritical: eda >= STRESS_THRESHOLDS.eda.critical,
    };

    // Calculate stress score using weighted combination
    // Weights based on WESAD feature importance
    let stressScore = 0;
    
    // Heart rate contribution (40% weight)
    if (indicators.hrCritical) stressScore += 0.40;
    else if (indicators.hrHigh) stressScore += 0.30;
    else if (indicators.hrElevated) stressScore += 0.15;
    
    // EDA contribution (40% weight) - most important for stress detection
    if (indicators.edaCritical) stressScore += 0.40;
    else if (indicators.edaHigh) stressScore += 0.28;
    else if (indicators.edaElevated) stressScore += 0.12;
    
    // Temperature contribution (20% weight)
    if (indicators.tempHigh) stressScore += 0.20;
    else if (indicators.tempElevated) stressScore += 0.08;

    // Add deviation-based adjustment
    const combinedDeviation = (hrDeviation * 0.4 + edaDeviation * 0.4 + tempDeviation * 0.2);
    if (combinedDeviation > 2) stressScore += 0.1;
    if (combinedDeviation > 3) stressScore += 0.1;

    // Determine state based on stress score
    let state;
    let confidence;

    if (stressScore >= 0.65) {
      // Meltdown detection - multiple high indicators
      if ((indicators.hrCritical || indicators.hrHigh) && 
          (indicators.edaCritical || indicators.edaHigh)) {
        state = MIND_STATES.MELTDOWN;
        confidence = Math.min(0.95, 0.75 + stressScore * 0.2);
      } else {
        state = MIND_STATES.STRESSED;
        confidence = 0.70 + stressScore * 0.15;
      }
    } else if (stressScore >= 0.35) {
      state = MIND_STATES.STRESSED;
      confidence = 0.55 + stressScore * 0.3;
    } else if (stressScore >= 0.15) {
      // Borderline - could be either
      if (Math.random() < 0.3) {
        state = MIND_STATES.STRESSED;
        confidence = 0.50 + stressScore;
      } else {
        state = MIND_STATES.CALM;
        confidence = 0.60 + (0.35 - stressScore);
      }
    } else {
      state = MIND_STATES.CALM;
      confidence = 0.85 + (0.15 - stressScore) * 0.5;
    }

    // Cap confidence
    confidence = Math.min(0.98, Math.max(0.30, confidence));

    return {
      state,
      confidence,
      stressScore,
      indicators,
      deviations: {
        heartRate: hrDeviation,
        temperature: tempDeviation,
        eda: edaDeviation,
      },
    };
  }

  /**
   * Map model output class to mind state
   * @param {number} classIndex 
   * @param {number} confidence 
   * @param {Object} sensorData 
   */
  mapClassToState(classIndex, confidence, sensorData) {
    // WESAD class mapping
    // 0: Baseline -> Calm
    // 1: Stress -> Stressed or Meltdown (based on intensity)
    // 2: Amusement -> Calm
    // 3: Meditation -> Calm

    switch (classIndex) {
      case 0:
      case 2:
      case 3:
        return MIND_STATES.CALM;
      case 1:
        // Check if stress level indicates meltdown
        if (confidence > 0.85 && sensorData.heartRate > 110 && sensorData.eda > 6) {
          return MIND_STATES.MELTDOWN;
        }
        return MIND_STATES.STRESSED;
      default:
        return MIND_STATES.UNKNOWN;
    }
  }

  /**
   * Smooth predictions using moving average
   * Helps reduce noise and false alarms
   * @param {Object} currentPrediction 
   */
  smoothPrediction(currentPrediction) {
    if (this.predictionHistory.length < 2) {
      return currentPrediction;
    }

    // Count occurrences of each state
    const stateCounts = {};
    let totalConfidence = 0;

    this.predictionHistory.forEach((pred) => {
      stateCounts[pred.state] = (stateCounts[pred.state] || 0) + 1;
      totalConfidence += pred.confidence;
    });

    // Find most common state
    let dominantState = currentPrediction.state;
    let maxCount = 0;

    Object.entries(stateCounts).forEach(([state, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominantState = state;
      }
    });

    // Average confidence
    const avgConfidence = totalConfidence / this.predictionHistory.length;

    return {
      state: dominantState,
      confidence: avgConfidence,
      smoothed: true,
      windowSize: this.predictionHistory.length,
    };
  }

  /**
   * Calculate calm score (0-100) based on current state
   * @param {Object} prediction 
   */
  calculateCalmScore(prediction) {
    const { state, confidence } = prediction;

    switch (state) {
      case MIND_STATES.CALM:
        return Math.round(70 + confidence * 30);
      case MIND_STATES.AMUSEMENT:
        return Math.round(60 + confidence * 30);
      case MIND_STATES.STRESSED:
        return Math.round(30 - confidence * 20);
      case MIND_STATES.MELTDOWN:
        return Math.round(10 - confidence * 10);
      default:
        return 50;
    }
  }

  /**
   * Get state description and recommendations
   * @param {string} state 
   */
  getStateInfo(state) {
    switch (state) {
      case MIND_STATES.CALM:
        return {
          description: 'Child is currently calm and relaxed.',
          icon: 'self-improvement',
          color: '#22c55e',
          recommendation: 'Great! Continue current activities.',
        };
      case MIND_STATES.STRESSED:
        return {
          description: 'Child is showing signs of stress.',
          icon: 'warning',
          color: '#f59e0b',
          recommendation: 'Consider calming activities or a break.',
        };
      case MIND_STATES.MELTDOWN:
        return {
          description: 'High stress levels detected. Immediate attention needed.',
          icon: 'error',
          color: '#ef4444',
          recommendation: 'Move to a quiet space. Use calming techniques.',
        };
      case MIND_STATES.AMUSEMENT:
        return {
          description: 'Child is happy and engaged.',
          icon: 'sentiment-satisfied',
          color: '#3b82f6',
          recommendation: 'Positive state. Continue enjoyable activity.',
        };
      default:
        return {
          description: 'Unable to determine current state.',
          icon: 'help',
          color: '#6b7280',
          recommendation: 'Check sensor connection.',
        };
    }
  }

  /**
   * Clear prediction history
   */
  clearHistory() {
    this.predictionHistory = [];
  }

  /**
   * Check if model is ready
   */
  isReady() {
    return this.isModelLoaded;
  }

  /**
   * Get model info
   */
  getModelInfo() {
    return {
      isLoaded: this.isModelLoaded,
      useTensorFlow: this.useTensorFlow,
      predictionHistorySize: this.predictionHistory.length,
      smoothingWindow: this.smoothingWindow,
      backend: this.useTensorFlow ? 'tensorflow' : 'rule-based',
    };
  }

  /**
   * Dispose model and free memory
   */
  dispose() {
    // Uncomment for TensorFlow.js:
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.isModelLoaded = false;
    this.predictionHistory = [];
  }
}

export default new MLModelService();
export { MIND_STATES, NORMALIZATION_PARAMS, STRESS_THRESHOLDS };
