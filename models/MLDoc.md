# Cyber Threat Intelligence API - Documentation

This document provides a complete guide for backend developers to set up, run, and integrate the Cyber Threat Intelligence API. The API uses several machine learning models to detect various cybersecurity threats.

## Table of Contents
1.  [Project Overview](#project-overview)
2.  [Directory Structure](#directory-structure)
3.  [Setup and Installation](#setup-and-installation)
4.  [Step 1: Training the Models](#step-1-training-the-models)
5.  [Step 2: Running the API Server](#step-2-running-the-api-server)
6.  [API Endpoint Reference](#api-endpoint-reference)
    *   [Phishing Detection](#phishing-detection)
    *   [Malware Detection](#malware-detection)
    *   [Ransomware Detection](#ransomware-detection)
    *   [Network Anomaly Detection](#network-anomaly-detection)
    *   [Zero-Day Attack Detection](#zero-day-attack-detection)
7.  [Testing the API](#testing-the-api)

---

## Project Overview

The API provides five main prediction endpoints, each powered by a separate machine learning model:
*   **Phishing:** Analyzes URLs, email subjects, and bodies to detect phishing attempts.
*   **Malware:** Analyzes process metrics to classify them as benign or malware.
*   **Ransomware:** Analyzes PE file characteristics to detect ransomware.
*   **Networking:** Analyzes network traffic logs to detect anomalies.
*   **Zero-Day:** Analyzes network events to identify potential zero-day attacks.

## Directory Structure

The project is organized by model, with a central `api` directory.

```
models/
├── api/
│   ├── main.py             # FastAPI application logic
│   └── test_api.py         # API integration test script
├── phishing/
│   ├── data/               # <-- Place phishing training CSV here
│   ├── models/             # Stores the trained phishing model
│   └── src/
│       └── phishing_model.py # Phishing model training script
├── malware/
│   └── ... (similar structure)
├── Ransomware/
│   └── ... (similar structure)
├── networking/
│   └── ... (similar structure)
└── zero_day_attack/
    └── ... (similar structure)
└── requirements.txt        # Project dependencies
└── README.md               # This documentation
```

---

## Setup and Installation

1.  **Prerequisites:**
    *   Python 3.8 or newer.

2.  **Clone the Repository:**
    *   Ensure you have the entire `models` directory.

3.  **Install Dependencies:**
    *   Navigate to the root `models` directory in your terminal.
    *   Run the following command to install all required libraries from the `requirements.txt` file:
    ```bash
    pip install -r requirements.txt
    ```

---

## Step 1: Training the Models

Before running the API, each model must be trained. This process reads a CSV file, trains a model, and saves the resulting `.pkl` file in the correct `models` subdirectory.

1.  **Place Data:** For each model, place its corresponding training `.csv` file inside its `data` folder (e.g., `models/phishing/data/phishing_data.csv`).

2.  **Run Training Scripts:** Execute each script from the terminal.

    ```bash
    # Train Phishing Model
    python phishing/src/phishing_model.py

    # Train Malware Model
    python malware/src/malware_model.py

    # Train Ransomware Model
    python Ransomware/src/ransomware_model.py

    # Train Networking Model
    python networking/src/networking.py

    # Train Zero-Day Model
    python zero_day_attack/src/zero_day_attack.py
    ```
    After running these, you should see `.pkl` files inside each model's `models` folder (e.g., `models/phishing/models/phishing_rf_model.pkl`).

---

## Step 2: Running the API Server

Once the models are trained, you can start the web server.

1.  **Navigate to the root `models` directory.**

2.  **Run the Uvicorn command:**
    ```bash
    uvicorn api.main:app --reload
    ```

3.  **Access the API:**
    *   The API will be available at `http://127.0.0.1:8000`.
    *   For interactive documentation (a great way to test endpoints manually), open your browser to `http://127.0.0.1:8000/docs`.

---

## API Endpoint Reference

All endpoints accept `POST` requests with a JSON body.

### Phishing Detection

*   **Endpoint:** `POST /predict/phishing`
*   **Description:** Predicts if an email, SMS, or URL is phishing. You can provide a URL, text content, or both.

**Request Body:**
```json
{
  "subject": "Urgent: Verify Your Account",
  "body": "Please click this link to verify your login details http://secure-login-account-verification.com",
  "url": "http://secure-login-account-verification.com"
}
```

**Success Response (200 OK):**
```json
{
  "prediction": "phishing",
  "confidence": 0.9867,
  "features": {
    "url_length": 44,
    "num_dots": 1,
    "num_hyphens": 3,
    "num_digits": 0,
    "has_https": 0,
    "has_at_symbol": 0,
    "num_slash": 2,
    "has_ip_address": 0,
    "contains_login": 1,
    "contains_verify": 1,
    "text_length": 56,
    "num_words": 6,
    "num_exclamations": 0,
    "contains_password": 0
  }
}
```

---

### Malware Detection

*   **Endpoint:** `POST /predict/malware`
*   **Description:** Predicts if a process is malware based on system-level features.

**Request Body:**
```json
{
  "millisecond": 0, "state": 0, "usage_counter": 0, "prio": 3069378560,
  "static_prio": 14274, "normal_prio": 0, "policy": 0, "vm_pgoff": 0,
  "vm_truncate_count": 13173, "task_size": 0, "cached_hole_size": 0,
  "free_area_cache": 24, "mm_users": 724, "map_count": 6850, "hiwater_rss": 0,
  "total_vm": 150, "shared_vm": 120, "exec_vm": 124, "reserved_vm": 210,
  "nr_ptes": 0, "end_data": 120, "last_interval": 3473, "nvcsw": 341974,
  "nivcsw": 0, "min_flt": 0, "maj_flt": 120, "fs_excl_counter": 0, "lock": 3204448256,
  "utime": 380690, "stime": 4, "gtime": 0, "cgtime": 0, "signal_nvcsw": 0
}
```

**Success Response (200 OK):**
```json
{
  "prediction": "malware",
  "confidence": 0.9933
}
```

---

### Ransomware Detection

*   **Endpoint:** `POST /predict/ransomware`
*   **Description:** Predicts if a file is ransomware based on its Portable Executable (PE) header features.

**Request Body:** *(Note: All features from the training data are available, but you only need to send the ones you have. Others will default to 0 or "unknown").*
```json
{
    "ApiVector": 1, "DllVector": 1, "NumberOfSections": 5, "CreationYear": 2021,
    "SizeOfCode": 51200, "SizeOfInitializedData": 10240, "AddressOfEntryPoint": 4096,
    "ImageBase": 4194304, "SectionAlignment": 4096, "FileAlignment": 512,
    "SizeOfImage": 81920, "SizeOfHeaders": 1024, "Checksum": 0,
    "DllCharacteristics_y": 34112, "SizeOfStackReserve": 1048576,
    "resources_mean_entropy": 3.5, "sus_sections": 2, "packer": 1, "E_text": 6.5, "E_data": 4.2,
    "OsVersion": "10.0", "Subsystem": "WindowsGUI", "Machine": "I386"
}
```

**Success Response (200 OK):**
```json
{
  "prediction": "malicious",
  "confidence": 0.855
}
```

---

### Network Anomaly Detection

*   **Endpoint:** `POST /predict/networking`
*   **Description:** Predicts if a network connection is an anomaly.

**Request Body:**
```json
{
    "duration": 0, "protocol_type": "tcp", "service": "private", "flag": "S0",
    "src_bytes": 0, "dst_bytes": 0, "land": 0, "wrong_fragment": 0,
    "urgent": 0, "hot": 0, "num_failed_logins": 0, "logged_in": 0,
    "num_compromised": 0, "root_shell": 0, "su_attempted": 0, "num_root": 0,
    "num_file_creations": 0, "num_shells": 0, "num_access_files": 0,
    "num_outbound_cmds": 0, "is_host_login": 0, "is_guest_login": 0,
    "count": 200, "srv_count": 10, "serror_rate": 1.0, "srv_serror_rate": 1.0,
    "rerror_rate": 0.0, "srv_rerror_rate": 0.0, "same_srv_rate": 0.05,
    "diff_srv_rate": 0.07, "srv_diff_host_rate": 0.0, "dst_host_count": 255,
    "dst_host_srv_count": 10, "dst_host_same_srv_rate": 0.04,
    "dst_host_diff_srv_rate": 0.05, "dst_host_same_src_port_rate": 0.0,
    "dst_host_srv_diff_host_rate": 0.0, "dst_host_serror_rate": 1.0,
    "dst_host_srv_serror_rate": 1.0, "dst_host_rerror_rate": 0.0,
    "dst_host_srv_rerror_rate": 0.0
}
```

**Success Response (200 OK):**
```json
{
  "prediction": "anomaly",
  "confidence": 1.0
}
```

---

### Zero-Day Attack Detection

*   **Endpoint:** `POST /predict/zero-day`
*   **Description:** Classifies a network event to detect potential zero-day threats.

**Request Body:** *(Note: Field names with spaces must be sent as-is in the JSON).*
```json
{
    "protocol": "TCP", "flag": "SYN", "family": "MalwareA",
    "seddaddress": "192.168.1.100", "expaddress": "10.0.0.5",
    "ip address": "192.168.1.100", "user-agent": "Mozilla/5.0",
    "geolocation": "US", "event description": "Suspicious outbound connection",
    "duration": 5, "src_bytes": 0, "dst_bytes": 0, "land": 0, "wrong_fragment": 0,
    "urgent": 0, "hot": 0, "num_failed_logins": 0, "logged_in": 0,
    "num_compromised": 0, "root_shell": 0, "su_attempted": 0, "num_root": 0,
    "count": 100, "srv_count": 1, "serror_rate": 1.0, "srv_serror_rate": 1.0,
    "anomaly score": 0.9, "session id": "session-xyz", "time": 1672531200,
    "error code": 1, "logistics id": "log-xyz", "number of packets": 10,
    "netflow bytes": 0, "response time": 5.0, "data transfer rate": 0.0,
    "clusters": 3, "port": 80, "prediction": "unknown", "usd": 0.0,
    "application layer data": "unknown", "payload size": 0, "btc": 0.0
}
```

**Success Response (200 OK):**
```json
{
  "prediction": "Zero-Day Attack",
  "class_probabilities": {
    "Benign": 0.0676,
    "Zero-Day Attack": 0.9324
  }
}
```

---

## Testing the API

A test script is provided at `api/test_api.py`. It demonstrates how to call each endpoint with sample data. It's a great reference for constructing the requests from a backend service.

To run the tests, first make sure the API server is running, then execute:
```bash
python api/test_api.py
```