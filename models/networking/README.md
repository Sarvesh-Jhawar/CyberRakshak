# 🌐 Network Anomaly Detection

This directory contains the training and inference pipeline for detecting network-based intrusions and anomalies.

## 📊 Model Details

- **Algorithm**: Random Forest with Pipeline Scaling
- **Features**: Netflow data (duration, bytes, flags, protocols)
- **Status**: Trained and serialized as `network_rf_model.pkl`

## 📁 Structure

- `data/`: CSV datasets for network traffic
- `models/`: Serialized model files
- `src/`: Core logic for network feature extraction and training
