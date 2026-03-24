import pandas as pd
import numpy as np
from pathlib import Path
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, accuracy_score
import joblib
import json

# -----------------------------------------------------
# Function to train and save the model
# -----------------------------------------------------
def train_model():
    BASE_DIR = Path(__file__).parent.resolve()
    DATA_DIR = BASE_DIR.parent / "data"
    MODELS_DIR = BASE_DIR.parent / "models"
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    print("\n--- DEBUGGING INFO ---")
    print(f"Script directory: {BASE_DIR}")
    print(f"Looking for CSV in: {DATA_DIR}")
    if DATA_DIR.exists():
        for f in os.listdir(DATA_DIR):
            print(f"- {f}")
    else:
        print(f"DATA_DIR '{DATA_DIR}' does not exist!")
    print("--- END DEBUG INFO ---\n")

    # Load dataset
    csv_file = DATA_DIR / "network_merged.csv"
    if not csv_file.exists():
        raise FileNotFoundError(f"{csv_file} not found!")

    data = pd.read_csv(csv_file)
    data.columns = [col.strip() for col in data.columns]

    # Drop unnamed columns & missing values
    data = data.loc[:, ~data.columns.str.contains("^Unnamed")].dropna()

    # Features and target
    X = data.drop(columns=["class", "dataset"])
    y = data["class"].map(lambda x: 1 if str(x).lower() != "normal" else 0)

    # Columns types
    categorical_cols = ["protocol_type", "service", "flag"]
    numerical_cols = [col for col in X.columns if col not in categorical_cols]

    # Preprocessing
    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_cols),
            ("num", StandardScaler(), numerical_cols)
        ]
    )

    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Pipeline
    model = RandomForestClassifier(
        n_estimators=150, max_depth=10, random_state=42, n_jobs=-1,
        class_weight='balanced', min_samples_leaf=5, min_samples_split=10
    )
    pipeline = Pipeline([
        ("preprocess", preprocessor),
        ("classifier", model)
    ])

    print("\n--- Training Model ---")
    pipeline.fit(X_train, y_train)

    # Evaluation
    preds = pipeline.predict(X_test)
    probs = pipeline.predict_proba(X_test)[:, 1]

    print("\n--- Classification Report ---")
    print(classification_report(y_test, preds, target_names=["Normal", "Anomaly"]))

    print("\n--- Confusion Matrix ---")
    print(confusion_matrix(y_test, preds))

    roc_auc = roc_auc_score(y_test, probs)
    print("\nROC-AUC:", round(roc_auc, 4))
    
    accuracy = accuracy_score(y_test, preds)
    print("Accuracy:", round(accuracy, 4))
    
    report = classification_report(y_test, preds, target_names=["Normal", "Anomaly"], output_dict=True)

    # Save metrics
    metrics = {
        "accuracy": round(accuracy, 4),
        "roc_auc": round(roc_auc, 4),
        "classification_report": report
    }
    with open(MODELS_DIR / "metrics.json", "w") as f:
        json.dump(metrics, f, indent=4)
    print(f"Metrics saved to: {MODELS_DIR / 'metrics.json'}")

    # Save model
    model_path = MODELS_DIR / "network_rf_model.pkl"
    joblib.dump(pipeline, model_path)
    print(f"\n✅ Model saved to: {model_path}")

    return pipeline

# -----------------------------------------------------
# Prediction function
# -----------------------------------------------------
def predict_samples(pipeline, test_cases):
    print("\n--- Sample Predictions ---")
    for i, sample in enumerate(test_cases, start=1):
        sample_df = pd.DataFrame([sample])
        prob = pipeline.predict_proba(sample_df)[0][1]
        label = pipeline.predict(sample_df)[0]
        print(f"Test Case {i}:")
        print(f"Prediction : {'Anomaly' if label == 1 else 'Normal'}")
        print(f"Confidence : {prob:.4f}\n")

# -----------------------------------------------------
# Main
# -----------------------------------------------------
if __name__ == "__main__":
    pipeline = train_model()

    # Define multiple test cases
    test_cases = [
        {
            "duration": 0, "protocol_type": "tcp", "service": "http", "flag": "SF",
            "src_bytes": 181, "dst_bytes": 5450, "land": 0, "wrong_fragment": 0,
            "urgent": 0, "hot": 0, "num_failed_logins": 0, "logged_in": 1,
            "num_compromised": 0, "root_shell": 0, "su_attempted": 0, "num_root": 0,
            "num_file_creations": 0, "num_shells": 0, "num_access_files": 0,
            "num_outbound_cmds": 0, "is_host_login": 0, "is_guest_login": 0,
            "count": 2, "srv_count": 2, "serror_rate": 0.0, "srv_serror_rate": 0.0,
            "rerror_rate": 0.0, "srv_rerror_rate": 0.0, "same_srv_rate": 1.0,
            "diff_srv_rate": 0.0, "srv_diff_host_rate": 0.0, "dst_host_count": 150,
            "dst_host_srv_count": 25, "dst_host_same_srv_rate": 0.17,
            "dst_host_diff_srv_rate": 0.0, "dst_host_same_src_port_rate": 0.0,
            "dst_host_srv_diff_host_rate": 0.0, "dst_host_serror_rate": 0.0,
            "dst_host_srv_serror_rate": 0.0, "dst_host_rerror_rate": 0.0,
            "dst_host_srv_rerror_rate": 0.0
        },
        # Add another test case
        {
            "duration": 100, "protocol_type": "udp", "service": "domain_u", "flag": "SF",
            "src_bytes": 105, "dst_bytes": 0, "land": 0, "wrong_fragment": 0,
            "urgent": 0, "hot": 0, "num_failed_logins": 0, "logged_in": 0,
            "num_compromised": 0, "root_shell": 0, "su_attempted": 0, "num_root": 0,
            "num_file_creations": 0, "num_shells": 0, "num_access_files": 0,
            "num_outbound_cmds": 0, "is_host_login": 0, "is_guest_login": 0,
            "count": 1, "srv_count": 1, "serror_rate": 0.0, "srv_serror_rate": 0.0,
            "rerror_rate": 0.0, "srv_rerror_rate": 0.0, "same_srv_rate": 1.0,
            "diff_srv_rate": 0.0, "srv_diff_host_rate": 0.0, "dst_host_count": 255,
            "dst_host_srv_count": 50, "dst_host_same_srv_rate": 0.5,
            "dst_host_diff_srv_rate": 0.0, "dst_host_same_src_port_rate": 0.0,
            "dst_host_srv_diff_host_rate": 0.0, "dst_host_serror_rate": 0.0,
            "dst_host_srv_serror_rate": 0.0, "dst_host_rerror_rate": 0.0,
            "dst_host_srv_rerror_rate": 0.0
        }
    ]

    predict_samples(pipeline, test_cases)
