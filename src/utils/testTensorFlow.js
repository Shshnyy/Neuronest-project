/**
 * Quick Test for TensorFlow.js Integration
 * 
 * Run this in your app to verify TF.js is working correctly
 * You can call this from DeviceInfo screen or Settings
 */

import * as tf from '@tensorflow/tfjs';
import MLModelService from '../services/MLModelService';

export async function testTensorFlowIntegration() {
  const results = {
    tfReady: false,
    backend: null,
    modelLoaded: false,
    predictionWorks: false,
    errors: [],
  };

  try {
    // Test 1: TensorFlow.js ready
    console.log('Test 1: Checking TensorFlow.js...');
    await tf.ready();
    results.tfReady = true;
    results.backend = tf.getBackend();
    console.log('✓ TensorFlow.js is ready');
    console.log('  Backend:', results.backend);

    // Test 2: Initialize ML Service
    console.log('\nTest 2: Initializing ML Service...');
    const initResult = await MLModelService.initialize();
    console.log('✓ ML Service initialized');
    console.log('  Result:', initResult);

    // Test 3: Load Model
    console.log('\nTest 3: Loading ML Model...');
    const loadResult = await MLModelService.loadModel();
    results.modelLoaded = loadResult.success;
    console.log('✓ Model loading attempted');
    console.log('  Result:', loadResult);

    // Test 4: Make Test Prediction
    console.log('\nTest 4: Testing prediction...');
    const testData = {
      heartRate: 75,
      temperature: 36.8,
      eda: 3.5,
    };
    
    const prediction = await MLModelService.predict(testData);
    results.predictionWorks = prediction.state !== 'Unknown';
    console.log('✓ Prediction completed');
    console.log('  Input:', testData);
    console.log('  Output:', prediction);

    // Test 5: Test with stress data
    console.log('\nTest 5: Testing stress detection...');
    const stressData = {
      heartRate: 115,
      temperature: 37.5,
      eda: 12.0,
    };
    
    const stressPrediction = await MLModelService.predict(stressData);
    console.log('✓ Stress prediction completed');
    console.log('  Input:', stressData);
    console.log('  Output:', stressPrediction);

    console.log('\n========== TEST SUMMARY ==========');
    console.log('TensorFlow.js Ready:', results.tfReady ? '✓' : '✗');
    console.log('Backend:', results.backend);
    console.log('Model Loaded:', results.modelLoaded ? '✓' : '✗');
    console.log('Predictions Work:', results.predictionWorks ? '✓' : '✗');
    console.log('==================================');

    return results;

  } catch (error) {
    console.error('Test failed:', error);
    results.errors.push(error.message);
    return results;
  }
}

export default testTensorFlowIntegration;
