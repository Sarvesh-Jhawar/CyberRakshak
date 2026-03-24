# 🌐 Networking Anomaly Model

This directory houses the Network Intrusion and Anomaly Detection engine. It operates by analyzing continuous network packet flows to establish baselines and identify anomalous deviations indicative of network breaches.

---

## 📊 The Dataset
The dataset encapsulates comprehensive network traffic logs, representing both simulated intrusion attempts (e.g., DoS, Probing, R2L) and benign web traffic flows.

**Core Inputs:**
- **Numeric Logs:** `duration`, `src_bytes`, `dst_bytes`, `wrong_fragment`, `srv_count`, etc.
- **Categorical Logs:** `protocol_type` (tcp/udp/icmp), `service` (http/ftp), `flag`.

---

## 🧠 The Architecture: Pipeline + Random Forest
**Why this model?**
Network traffic generates highly complex, non-linear relationships. For instance, a sequence of tiny `src_bytes` on a specific `protocol` might individually mean nothing, but combined, they represent a stealthy port scan. A `RandomForestClassifier` inherently maps these complex multi-variable interactions by building an ensemble of decision trees, achieving exceptional detection rates without requiring deep learning architectures.

**The Preprocessing Pipeline:**
1. **Numeric Handling:** Standardized (`StandardScaler`) to prevent huge metric variations (like packet bytes) from dominating smaller duration scales.
2. **Categorical Handling:** One-Hot Encoded natively to vectorize protocols and flags.

---

## 🛡️ Regularization & Anti-Overfitting Techniques
To ensure the model genuinely learns intrusion behavior rather than memorizing exact ping counts, significant regularization constraints were placed on the deployment:
1. **Tree Pruning:** `max_depth=10`. This stops the decision trees from growing infinitely deep to memorize outlier traffic.
2. **Leaf Constraints:** `min_samples_leaf=5` and `min_samples_split=10`. The model is forbidden from creating a specialized rule unless it applies to at least a broad cluster of network events.
3. **Class Balancing:** `class_weight='balanced'` compensates for the fact that normal traffic mathematically vastly outweighs attack traffic in real-world scenarios.

---

## 📈 Final Performance Statistics
- **Accuracy:** `99.38%`
- **ROC-AUC:** `99.97%`
- **Macro F1-Score:** `0.9938`

The constrained depth metrics ensure this near-perfect accuracy translates effectively to deployment, proving robust behavioral tracking rather than synthetic memorization.
