import os
import pickle
import pandas as pd
try:
    from sklearn.ensemble import RandomForestClassifier
    import sklearn
except ImportError:
    pass

def print_model_stats(file_path):
    print("="*60)
    print(f"MODEL FILE: {os.path.basename(file_path)}")
    print(f"PATH: {file_path}")
    print("-"*40)
    
    try:
        import joblib
        try:
            model = joblib.load(file_path)
        except Exception:
            with open(file_path, 'rb') as f:
                model = pickle.load(f)
            
        # Basic Type Info
        print(f"Type: {type(model).__name__}")
        
        # If it's a list or dict (like features file)
        if isinstance(model, (list, tuple)):
            print(f"Contains: List of {len(model)} items")
            print(f"First 5 items: {model[:5]}")
        elif isinstance(model, dict):
            print(f"Contains: Dictionary with {len(model.keys())} keys")
            print(f"Keys: {list(model.keys())}")
        
        # If it's a Scikit-Learn model
        elif hasattr(model, 'get_params'):
            params = model.get_params()
            print("Model Parameters:")
            for p, v in list(params.items())[:10]: # Show first 10 params
                print(f"  - {p}: {v}")
            if len(params) > 10:
                print(f"  ... and {len(params)-10} more.")
                
            # Check for fitted attributes
            if hasattr(model, 'n_features_in_'):
                print(f"Input Features: {model.n_features_in_}")
            
            # Specific to Random Forest / Tree models
            if hasattr(model, 'feature_importances_'):
                print("Top 5 Feature Importances:")
                importances = model.feature_importances_
                for i, imp in enumerate(importances[:5]):
                    print(f"  - Feature {i}: {imp:.4f}")

        else:
            print("Contents of the pickle file:")
            print(str(model)[:500] + "..." if len(str(model)) > 500 else str(model))

        # Check for metrics.json in the same directory
        metrics_path = os.path.join(os.path.dirname(file_path), "metrics.json")
        if os.path.exists(metrics_path):
            try:
                import json
                with open(metrics_path, 'r') as mf:
                    metrics = json.load(mf)
                print("-" * 20)
                print("PERFORMANCE METRICS:")
                if "accuracy" in metrics:
                    print(f"  - Accuracy: {metrics['accuracy']:.4f}")
                if "roc_auc" in metrics and metrics["roc_auc"] is not None:
                    print(f"  - ROC-AUC: {metrics['roc_auc']:.4f}")
                
                # Print classification report summary if available
                if "classification_report" in metrics:
                    report = metrics["classification_report"]
                    if "macro avg" in report:
                        avg = report["macro avg"]
                        print(f"  - Macro F1-Score: {avg['f1-score']:.4f}")
                        print(f"  - Macro Precision: {avg['precision']:.4f}")
                        print(f"  - Macro Recall: {avg['recall']:.4f}")
            except Exception as me:
                print(f"Error loading metrics: {me}")

    except Exception as e:
        print(f"Error loading model: {e}")
    print("="*60 + "\n")

if __name__ == "__main__":
    # Get the project root directory (the directory containing this script)
    project_root = os.path.dirname(os.path.abspath(__file__))
    
    # List of models found (relative to project root)
    model_paths = [
        os.path.join("models", "networking", "models", "network_rf_model.pkl"),
        os.path.join("models", "zero_day_attack", "models", "zero_day_model.pkl"),
        os.path.join("models", "malware", "models", "malware_rf_model.pkl"),
        os.path.join("models", "malware", "models", "malware_features.pkl"),
        os.path.join("models", "Ransomware", "models", "ransomware_rf_model.pkl"),
        os.path.join("models", "phishing", "models", "phishing_rf_model.pkl"),
        os.path.join("models", "phishing", "models", "phishing_features.pkl")
    ]
    
    # Check if they exist and print stats
    for path in model_paths:
        full_path = os.path.join(project_root, path)
        if os.path.exists(full_path):
            print_model_stats(full_path)
        else:
            print(f"File not found: {path} (checked at {full_path})")
