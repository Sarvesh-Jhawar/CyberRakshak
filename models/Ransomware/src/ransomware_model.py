import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix, accuracy_score
import joblib
import json
from pathlib import Path
import os

# -----------------------------------------------------
# Base paths
# -----------------------------------------------------
BASE_DIR = Path(__file__).parent.resolve()
DATA_DIR = BASE_DIR.parent / "data"
MODELS_DIR = BASE_DIR.parent / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

# -----------------------------------------------------
# Debug info
# -----------------------------------------------------
print("--- DEBUGGING INFO ---")
print(f"Script directory: {BASE_DIR}")
print(f"Looking for CSV in: {DATA_DIR}")
if DATA_DIR.exists():
    for f in os.listdir(DATA_DIR):
        print(f"- {f}")
else:
    print(f"DATA_DIR '{DATA_DIR}' does not exist!")
print("--- END DEBUG INFO ---\n")

# -----------------------------------------------------
# Load dataset
# -----------------------------------------------------
csv_files = list(DATA_DIR.glob("*.csv"))
if not csv_files:
    raise FileNotFoundError(f"No CSV file found in {DATA_DIR}")
data_file = csv_files[0]
data = pd.read_csv(data_file, engine='python', on_bad_lines='skip')
data.columns = [col.strip() for col in data.columns]
data = data.loc[:, ~data.columns.str.contains('^Unnamed')]

# -----------------------------------------------------
# Drop identifiers
# -----------------------------------------------------
identifiers = ["FileName", "md5Hash", "sha1"]
data = data.drop(columns=[col for col in identifiers if col in data.columns])

# -----------------------------------------------------
# Target column
# -----------------------------------------------------
if "Benign" in data.columns:
    TARGET_COL = "Benign"
elif "Class" in data.columns:
    TARGET_COL = "Class"
else:
    raise ValueError("Dataset must have 'Benign' or 'Class' column as target")

data = data.dropna(subset=[TARGET_COL])
data[TARGET_COL] = data[TARGET_COL].astype(int)

# -----------------------------------------------------
# Separate features
# -----------------------------------------------------
categorical_cols = [c for c in data.columns if data[c].dtype == 'object' and c != TARGET_COL]
numeric_cols = [c for c in data.columns if c not in categorical_cols + [TARGET_COL]]

data[numeric_cols] = data[numeric_cols].fillna(0)
data[categorical_cols] = data[categorical_cols].fillna('unknown')

# -----------------------------------------------------
# Preprocessing pipeline
# -----------------------------------------------------
numeric_transformer = StandardScaler()
categorical_transformer = OneHotEncoder(handle_unknown='ignore', sparse_output=False)

preprocessor = ColumnTransformer(
    transformers=[
        ('num', numeric_transformer, numeric_cols),
        ('cat', categorical_transformer, categorical_cols)
    ]
)

# -----------------------------------------------------
# Train/Test split
# -----------------------------------------------------
X = data[numeric_cols + categorical_cols]
y = data[TARGET_COL]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print("Classes in training data:", np.unique(y_train))

# -----------------------------------------------------
# Model pipeline
# -----------------------------------------------------
model = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('classifier', RandomForestClassifier(
        n_estimators=50, max_depth=5, random_state=42, n_jobs=-1, 
        class_weight='balanced', min_samples_leaf=5, min_samples_split=10
    ))
])

# Train
model.fit(X_train, y_train)

# Predict & evaluate
preds = model.predict(X_test)
probs = model.predict_proba(X_test)
if probs.shape[1] == 1:  # single-class edge case
    probs = np.hstack([1 - probs, probs])

malware_probs = probs[:, 1]

print("\n--- Classification Report ---")
report = classification_report(y_test, preds, output_dict=True)
print(classification_report(y_test, preds))
print("--- Confusion Matrix ---")
print(confusion_matrix(y_test, preds))
accuracy = accuracy_score(y_test, preds)
print("Accuracy:", round(accuracy, 4))
try:
    if len(np.unique(y_test)) > 1:
        roc = roc_auc_score(y_test, malware_probs)
    else:
        roc = None
except:
    roc = None
print("ROC-AUC:", roc)

# Save metrics
metrics = {
    "accuracy": round(accuracy, 4),
    "roc_auc": round(roc, 4) if roc is not None else None,
    "classification_report": report
}
with open(MODELS_DIR / "metrics.json", "w") as f:
    json.dump(metrics, f, indent=4)
print(f"Metrics saved to: {MODELS_DIR / 'metrics.json'}")

# -----------------------------------------------------
# Save model
# -----------------------------------------------------
model_file = MODELS_DIR / "ransomware_rf_model.pkl"
numeric_cols_file = MODELS_DIR / "ransomware_numeric_cols.pkl"
categorical_cols_file = MODELS_DIR / "ransomware_categorical_cols.pkl"

joblib.dump(model, model_file)
joblib.dump(numeric_cols, numeric_cols_file)
joblib.dump(categorical_cols, categorical_cols_file)

print(f"\nModel saved to: {model_file}")
print(f"Numeric columns saved to: {numeric_cols_file}")
print(f"Categorical columns saved to: {categorical_cols_file}")

# -----------------------------------------------------
# Load model for new input analysis
# -----------------------------------------------------
ANALYSIS_MODEL = joblib.load(model_file)

def analyze_input(row: dict):
    df = pd.DataFrame([row])
    pred_prob = ANALYSIS_MODEL.predict_proba(df)
    if pred_prob.shape[1] == 1:
        pred_prob = np.hstack([1 - pred_prob, pred_prob])
    pred_label = int(pred_prob[0][1] >= 0.5)
    return {
        "input_features": row,
        "model_prediction": "malicious" if pred_label else "benign",
        "prediction_confidence": round(float(pred_prob[0][1]), 4)
    }

# -----------------------------------------------------
# Example test cases
# -----------------------------------------------------
if __name__ == "__main__":
    test_cases = [
        {"name": "Sample PE 1 (Malicious)", "input": {col: 0 for col in numeric_cols}},
        {"name": "Sample PE 2 (Benign)", "input": {col: 0 for col in numeric_cols}}
    ]
    # Assign first categorical values
    for c in categorical_cols:
        for case in test_cases:
            case["input"][c] = data[c].iloc[0]

    print("\n--- Running Test Cases ---\n")
    for idx, case in enumerate(test_cases, start=1):
        result = analyze_input(case["input"])
        status = "⚠️ Malicious Detected" if result["model_prediction"] == "malicious" else "✅ Benign"
        print(f"Test Case {idx}: {case['name']}")
        print(f"Prediction: {result['model_prediction'].upper()} ({status})")
        print(f"Confidence: {result['prediction_confidence']}")
        print(f"Input Features: {result['input_features']}")
        print("-" * 80)
