# 🤖 Cyber Threat Intelligence API: Inference Engine

This directory contains the central inference engine that exposes our five specialized machine learning models via a RESTful FastAPI interface.

## 🚀 Overview

The Inference Engine is the heart of the "router-to-synthesizer" architecture. It receives data from the main backend, performs hard mathematical analysis using `.pkl` model files, and returns probabilistic threat scores.

## 🔌 API Endpoints (Port 8001)

All endpoints accept `POST` requests with JSON payloads.

| Endpoint | Purpose | Triggered By |
| --- | --- | --- |
| `/predict/phishing` | Analyzes URLs & Text for Phishing | Suspicious links/texts |
| `/predict/malware` | Analyzes Process Metrics for Malware | OS service anomalies |
| `/predict/ransomware` | Analyzes PE Headers for Ransomware | Suspicious file execution |
| `/predict/networking` | Analyzes Traffic Logs for Intrusion | Network spikes/anomalies |
| `/predict/zero-day` | Analyzes Unknown Payload Vectors | Unidentified threats |

## 📁 Directory Structure

- `main.py`: The FastAPI application containing the routing logic and model loading.
- `requirements.txt`: Python dependencies specific to the inference engine (FastAPI, Uvicorn, Scikit-learn).
- `test_api.py`: A comprehensive testing script to validate the API health and prediction accuracy.

## ⚙️ Model Artifacts

The API dynamically loads models from the parent directory:
- `../phishing/models/phishing_rf_model.pkl`
- `../malware/models/malware_rf_model.pkl`
- `../Ransomware/models/ransomware_rf_model.pkl`
- `../networking/models/network_rf_model.pkl`
- `../zero_day_attack/models/zero_day_model.pkl`

---
<div align="center">
  <i>"Speed and precision in threat detection through automated inference."</i>
</div>
