# 🛡️ CyberRakshak Machine Learning Core

Welcome to the **CyberRakshak** AI subsystem. This directory hosts the five primary machine learning models orchestrating our cybersecurity threat detection stack. Each model is tailored to combat a specific vector of cyber attacks, engineered with robust preprocessing pipelines, feature engineering, and anti-overfitting constraints.

---

## 🧭 System Overview

| Threat Vector | Backing Model | Core Technique | Latest Accuracy |
| --- | --- | --- | --- |
| 🌐 **Networking** | Pipeline + Random Forest | OneHotEncoding, Feature Scaling, Tree Pruning | **99.38%** |
| 🦠 **Malware** | Random Forest | Max Depth Constraint, Balanced Weights | **97.50%** |
| 🎣 **Phishing** | Random Forest | Heuristic Feature Extraction | **99.86%** |
| 🕵️ **Zero-Day** | Pipeline + Logistic Regression | Categorical Imputation, Leakage Prevention | **100.0%** |
| 🗄️ **Ransomware** | Pipeline + Feature Selection | ANOVA K-Best (k=30), Random Forest | **100.0%** |

---

## 🧠 Model Architectures & Strategies

### 1. 🌐 Network Anomaly Model (`network_rf_model.pkl`)
- **Dataset:** Network traffic metadata containing features like `duration`, `src_bytes`, `dst_bytes`, and protocol types.
- **Algorithm Used:** `RandomForestClassifier` (Pipeline)
- **Why this model?** Network traffic possesses highly non-linear traits. Random Forests intuitively map the complex rule boundaries of varied intrusion protocols without exploding in computational cost.
- **Techniques Applied:** 
  - Standardized numeric features and One-Hot Encoded categorical variables (`protocol_type`, `service`, `flag`).
  - Constrained `max_depth=10` and `min_samples_leaf=5` to generalize traffic patterns instead of memorizing data anomalies.
- **Confidence Metrics:** 
  - **Accuracy:** 99.38% | **ROC-AUC:** 99.97% | **Macro F1:** 99.38%

### 2. 🦠 Malware Detection Model (`malware_rf_model.pkl`)
- **Dataset:** PE (Portable Executable) header properties and memory mapping analytics (e.g., `prio`, `usage_counter`).
- **Algorithm Used:** `RandomForestClassifier`
- **Why this model?** Tree-based algorithms naturally excel at mapping the structured dimensions of software executables into malicious or benign categories.
- **Techniques Applied:**
  - Aggressive tree pruning (`max_depth=5`) to retain only the most globally applicable threat heuristics.
  - Extracted 33 core numeric properties for high-speed inference.
- **Confidence Metrics:** 
  - **Accuracy:** 97.50% | **ROC-AUC:** 99.72% | **Macro F1:** 97.50%

### 3. 🎣 Phishing URL Evaluator (`phishing_rf_model.pkl`)
- **Dataset:** Explicit mapping of structural components across verified Phishing and Safe URLs.
- **Algorithm Used:** `RandomForestClassifier`
- **Why this model?** Phishing sites betray themselves through distinct structural anomalies (like embedded IP addresses instead of domains). A Random Forest perfectly isolates these fragmented indicators into a unified risk consensus.
- **Techniques Applied:**
  - Automated feature engineering dynamically extracts attributes from raw URLs (`url_length`, `num_dots`, `has_https`).
  - `class_weight='balanced'` ensures the model operates cleanly even if safe links heavily outnumber malicious traps in real-world scraping.
- **Confidence Metrics:** 
  - **Accuracy:** 99.86% | **ROC-AUC:** 99.95% | **Macro F1:** 99.85%

### 4. 🕵️ Zero-Day Attack Model (`zero_day_model.pkl`)
- **Dataset:** Threat intelligence encapsulating IP protocols, payload sizes, and flag anomalies.
- **Algorithm Used:** `LogisticRegression` (Pipeline)
- **Why this model?** Zero-day exploits inherently break prior patterns. By leveraging Logistic Regression, we enforce a highly interpretable, linear mapping of core packet metrics that avoids the hyper-memorization of decision trees.
- **Techniques Applied:**
  - Advanced data-leakage suppression: explicitly banning identifying traits (`session id`, `ip address`) ensuring the model judges purely on behavioral payload mathematics (`netflow bytes`, `port`).
  - Pipeline integration utilizing `SimpleImputer` natively supports robust real-world incomplete data streams.
- **Confidence Metrics:** 
  - **Accuracy:** 100.0% | **Macro F1:** 100.0%

### 5. 🗄️ Ransomware Behavioral Model (`ransomware_rf_model.pkl`)
- **Dataset:** Massive arrays tracking intense operating system behavior including registry modifications, DNS requests, and DLL executions.
- **Algorithm Used:** `SelectKBest` + `RandomForestClassifier` (Pipeline)
- **Why this model?** Ransomware execution leaves blazing trails in localized OS APIs. The architecture uses ANOVA scoring to extract those specific flare patterns, ignoring ambient noise.
- **Techniques Applied:**
  - **Automated Feature Reduction:** Funnels 90 raw metrics through a statistical filter (`SelectKBest: k=30`), forcing the model to only "see" the 30 most highly correlated threat metrics. 
  - Limits tree structures with `max_depth=5` and class balancing for rapid inference on endpoint agents.
- **Confidence Metrics:** 
  - **Accuracy:** 100.0% | **Macro F1:** 100.0%

---

*This document scales dynamically with `model_stats.py` output traces. For developer re-training schemas, please reference `train_all_models.py` situated in the root.*
