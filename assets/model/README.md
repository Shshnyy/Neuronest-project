# ML Model Integration Guide

## How to Export Your WESAD Model from Google Colab

Your trained model needs to be converted to TensorFlow.js format. Follow these steps:

### Step 1: Install TensorFlow.js Converter in Colab

```python
!pip install tensorflowjs
```

### Step 2: Export Your Keras/TensorFlow Model

```python
import tensorflowjs as tfjs

# If you have a Keras model
tfjs.converters.save_keras_model(model, 'tfjs_model')

# This creates:
# - model.json (architecture)
# - group1-shard1of1.bin (weights)
```

### Step 3: Download the Files

```python
from google.colab import files
import shutil

# Zip the model folder
shutil.make_archive('tfjs_model', 'zip', 'tfjs_model')
files.download('tfjs_model.zip')
```

### Step 4: Copy to Your App

1. Unzip the downloaded `tfjs_model.zip`
2. Rename `group1-shard1of1.bin` to `weights.bin`
3. Copy both files to: `frontend/assets/model/`
   - `model.json`
   - `weights.bin`

### Alternative: Export from Scikit-learn

If your model is trained with scikit-learn:

```python
# First, convert to ONNX, then to TensorFlow.js
# Or use the rule-based fallback (already implemented)

# For a simple approach, you can also create a simple TensorFlow model 
# that mimics your sklearn model:

import tensorflow as tf
import numpy as np

# Example: Creating a simple neural network with similar behavior
model = tf.keras.Sequential([
    tf.keras.layers.Dense(32, activation='relu', input_shape=(3,)),
    tf.keras.layers.Dense(16, activation='relu'),
    tf.keras.layers.Dense(4, activation='softmax')  # 4 classes: Baseline, Stress, Amusement, Meditation
])

# Train with your data
model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
model.fit(X_train, y_train, epochs=50, validation_split=0.2)

# Export
tfjs.converters.save_keras_model(model, 'tfjs_model')
```

## Model Input Format

The model expects normalized sensor data:

| Feature | Mean | Std | Description |
|---------|------|-----|-------------|
| Heart Rate | 75 | 15 | BPM |
| Temperature | 36.5 | 0.5 | Celsius |
| EDA | 2.0 | 1.5 | Microsiemens |

## Model Output Classes

| Index | WESAD Class | App State |
|-------|-------------|-----------|
| 0 | Baseline | Calm |
| 1 | Stress | Stressed/Meltdown |
| 2 | Amusement | Calm |
| 3 | Meditation | Calm |

## Testing Without Model

If the model files are not present, the app will automatically use a rule-based fallback that considers:
- Heart rate > 100 BPM → stress indicator
- Heart rate > 120 BPM → high stress indicator
- Temperature > 37.2°C → stress indicator
- EDA > 4 μS → stress indicator
- EDA > 8 μS → high stress indicator

The fallback combines these indicators to determine the overall state.

## Normalization Parameters

Update `src/services/MLModelService.js` if your model uses different normalization:

```javascript
const NORMALIZATION_PARAMS = {
  heartRate: { mean: YOUR_HR_MEAN, std: YOUR_HR_STD },
  temperature: { mean: YOUR_TEMP_MEAN, std: YOUR_TEMP_STD },
  eda: { mean: YOUR_EDA_MEAN, std: YOUR_EDA_STD },
};
```
