# 🎣 Phishing Pattern Model

The Phishing Engine utilizes custom feature-transformation pipelines designed specifically for mapping textual URL anomalies and domain deception architectures.

---

## 📊 The Dataset
The dataset maps two main variables: safe target URLs juxtaposed alongside historically deceptive, typo-squatted, or synthetically generated Phishing URLs.
**Heuristic Mapping:** The dataset is algorithmically digested through a Python parsing engine extracting structural integers natively from the strings (e.g., `url_length`, `num_dots`, `has_ip_address`).

---

## 🧠 The Architecture: Custom Extraction + Random Forest

**Why this model?**
Phishing fundamentally relies on discrete, visible URL structures to trick users (`http://192.168...` or `secure-login-update.com`). Text vectorization (NLP) often fails on URLs because attackers cycle words dynamically. By mapping the logical structure instead, an ensemble Random Forest optimally slices these binary conditions uniformly—isolating threats gracefully. 

---

## 🛡️ Regularization & Structural Re-Engineering
The algorithm achieved deep performance mapping via careful dataset stabilization:
1. **Vertical Melting Re-engineering:** The physical data arrays were melted vertically to explicitly align `PHISHING` URLs exactly with `1` targets and `SAFE` URLs with `0` targets, mathematically preventing pipeline collapse and guaranteeing proper Target stratification logic during testing.
2. **Moderate Constraints:** Rather than aggressive throttling, the models utilize `max_depth=12` and `min_samples_leaf=2`. This permits the Random Forest to capture longer string complexities and slight variations in Phishing subdomains without suffocating its associative logic.
3. **Balanced Weights:** Prevents the system from defaulting to safe results in deployments where safe traffic radically outnumbers phishing.

---

## 📈 Final Performance Statistics
- **Accuracy:** `99.86%`
- **ROC-AUC:** `99.95%`
- **Macro F1-Score:** `0.9985`

These optimized scores rely purely on the robustness of the algorithmic feature extraction metrics (`num_dots`, `has_https`, `num_slash`). They reflect exactly how effectively those logic triggers segment deceptive domain traits natively in cyberspace.
