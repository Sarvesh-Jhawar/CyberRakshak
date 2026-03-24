import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score, accuracy_score
from sklearn.feature_extraction.text import TfidfVectorizer
import joblib
import json
import re
from pathlib import Path
from urllib.parse import urlparse
import os
import string
from bs4 import BeautifulSoup

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

# Drop unnecessary unnamed columns
data = data.loc[:, ~data.columns.str.contains('^Unnamed')]

# -----------------------------------------------------
# Stopwords (without NLTK)
# -----------------------------------------------------
STOPWORDS = {
    'a','about','above','after','again','against','all','am','an','and','any','are','as','at','be','because','been',
    'before','being','below','between','both','but','by','could','did','do','does','doing','down','during','each',
    'few','for','from','further','had','has','have','having','he','her','here','hers','herself','him','himself','his',
    'how','i','if','in','into','is','it','its','itself','just','me','more','most','my','myself','no','nor','not','now',
    'of','off','on','once','only','or','other','our','ours','ourselves','out','over','own','same','she','should','so',
    'some','such','than','that','the','their','theirs','them','themselves','then','there','these','they','this','those',
    'through','to','too','under','until','up','very','was','we','were','what','when','where','which','while','who','whom',
    'why','will','with','you','your','yours','yourself','yourselves'
}

# -----------------------------------------------------
# Text cleaning function
# -----------------------------------------------------
def clean_text(text):
    if pd.isna(text):
        return ""
    text = BeautifulSoup(str(text), "html.parser").get_text()
    text = text.lower()
    text = text.translate(str.maketrans('', '', string.punctuation))
    tokens = [w for w in text.split() if w not in STOPWORDS]
    return " ".join(tokens)

# -----------------------------------------------------
# URL feature extraction
# -----------------------------------------------------
def extract_url_features(url):
    return {
        "url_length": len(url),
        "num_dots": url.count('.'),
        "num_hyphens": url.count('-'),
        "num_digits": sum(c.isdigit() for c in url),
        "has_https": int("https" in url.lower()),
        "has_at_symbol": int("@" in url),
        "num_slash": url.count('/'),
        "has_ip_address": int(bool(re.match(r"^\d{1,3}(\.\d{1,3}){3}$", urlparse(url).hostname or ""))),
        "contains_login": int("login" in url.lower()),
        "contains_verify": int("verify" in url.lower())
    }

# -----------------------------------------------------
# Text feature extraction
# -----------------------------------------------------
def extract_text_features(subject, body):
    combined = clean_text(str(subject) + " " + str(body))
    return {
        "text_length": len(combined),
        "num_words": len(combined.split()),
        "num_exclamations": combined.count('!'),
        "num_digits": sum(c.isdigit() for c in combined),
        "contains_login": int("login" in combined),
        "contains_verify": int("verify" in combined),
        "contains_password": int("password" in combined)
    }

# -----------------------------------------------------
# Combine URL + text features
# -----------------------------------------------------
def extract_combined_features(row):
    # This function now expects a single 'url' field from the row Series/dict
    feats = {}
    url = row.get('url', '')
    if url and pd.notna(url):
        feats.update(extract_url_features(url))
    feats.update(extract_text_features(row.get('subject', ''), row.get('body', '')))
    return pd.Series(feats)

# -----------------------------------------------------
# Prepare dataset
# -----------------------------------------------------

# Ensure 'label' column exists
if 'label' not in data.columns:
    raise ValueError("Dataset must have a 'label' column (1=phishing, 0=safe)")

# Drop rows with missing labels
data = data.dropna(subset=['label'])
data['label'] = data['label'].astype(int)

# --- UNIFY URLS to match API ---
# Create a single 'url' column from the separate ones.
# Note: The dataset has 'PHISING URL ' (typo with one 'H' and trailing space)
phishing_col = next((c for c in data.columns if 'PHIS' in c.upper() and 'URL' in c.upper()), None)
safe_col = next((c for c in data.columns if 'SAFE' in c.upper() and 'URL' in c.upper()), None)

if phishing_col:
    # Use fillna if safe_col exists, otherwise just the phishing column
    if safe_col:
        data['url'] = data[phishing_col].fillna(data[safe_col])
    else:
        data['url'] = data[phishing_col]
elif safe_col:
    data['url'] = data[safe_col]
else:
    raise ValueError("Could not find a URL column in the dataset")

# Now we can drop the old columns and any rows that still don't have a url
cols_to_drop = [c for c in [phishing_col, safe_col] if c is not None]
data = data.drop(columns=cols_to_drop, errors='ignore')
data = data.dropna(subset=['url'])


# Apply feature extraction
if len(data) == 0:
    print("⚠️ WARNING: No labeled samples found. Using minimal fallback dataset for training.")
    # Create a small synthetic dataset to ensure training completes
    fallback_data = pd.DataFrame([
        {'url': 'http://phishing-site.com', 'label': 1, 'subject': 'urgent', 'body': 'click here'},
        {'url': 'https://google.com', 'label': 0, 'subject': 'hello', 'body': 'normal email'},
        {'url': 'http://secure-login.net', 'label': 1, 'subject': 'verify', 'body': 'update your info'},
        {'url': 'https://github.com', 'label': 0, 'subject': 'update', 'body': 'new release'}
    ])
    feature_df = fallback_data.apply(extract_combined_features, axis=1)
    X = feature_df.fillna(0)
    y = fallback_data['label']
else:
    feature_df = data.apply(extract_combined_features, axis=1)
    X = feature_df.fillna(0)
    y = data['label']

# -----------------------------------------------------
# Train/Test split
# -----------------------------------------------------
ts = 0.2 if len(y) > 10 else 0.5
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=ts, random_state=42, stratify=y
)

# -----------------------------------------------------
# Train Random Forest
# -----------------------------------------------------
model = RandomForestClassifier(
    n_estimators=150, max_depth=8, random_state=42, n_jobs=-1,
    class_weight='balanced', min_samples_leaf=5, min_samples_split=10
)
model.fit(X_train, y_train)

# Evaluate
preds = model.predict(X_test)
probs = model.predict_proba(X_test)
if probs.shape[1] == 1:
    probs = np.hstack([1 - probs, probs])

print("\nClassification Report:")
report = classification_report(y_test, preds, output_dict=True)
print(classification_report(y_test, preds))
accuracy = accuracy_score(y_test, preds)
roc_auc = roc_auc_score(y_test, probs[:, 1])
print("Accuracy:", round(accuracy, 4))
print("ROC-AUC:", round(roc_auc, 4))

# Save metrics
metrics = {
    "accuracy": round(accuracy, 4),
    "roc_auc": round(roc_auc, 4),
    "classification_report": report
}
with open(MODELS_DIR / "metrics.json", "w") as f:
    json.dump(metrics, f, indent=4)
print(f"Metrics saved to: {MODELS_DIR / 'metrics.json'}")

# -----------------------------------------------------
# Save model and features
# -----------------------------------------------------
model_file = MODELS_DIR / "phishing_rf_model.pkl"
features_file = MODELS_DIR / "phishing_features.pkl"

joblib.dump(model, model_file)
joblib.dump(list(X.columns), features_file)
print(f"\nModel saved to: {model_file}")
print(f"Feature list saved to: {features_file}")

# -----------------------------------------------------
# Load model for analysis
# -----------------------------------------------------
ANALYSIS_MODEL = joblib.load(model_file)
ANALYSIS_FEATURES = joblib.load(features_file)

# -----------------------------------------------------
# Analyze new input (URL, email, SMS)
# -----------------------------------------------------
def analyze_input(row):
    feats = extract_combined_features(pd.Series(row))
    feat_array = np.array([feats.get(f, 0) for f in ANALYSIS_FEATURES]).reshape(1, -1)
    pred_prob = ANALYSIS_MODEL.predict_proba(feat_array)[0][1]
    pred_label = int(pred_prob >= 0.5)

    output = {
        "sender": row.get("sender", ""),
        "receiver": row.get("receiver", ""),
        "subject": row.get("subject", ""),
        "body": row.get("body", ""),
        "urls": [row.get("url", "")],
        "model_prediction": "phishing" if pred_label else "legitimate",
        "prediction_confidence": round(float(pred_prob), 4),
        "feature_contributions": feats.to_dict(),
        "advisory_context": "Features guide an LLM to explain phishing risk factors and mitigation."
    }
    return json.dumps(output, indent=4)

# -----------------------------------------------------
# Example test cases
# -----------------------------------------------------
# -----------------------------------------------------
# Example test runner with multiple cases
# -----------------------------------------------------
if __name__ == "__main__":
    test_cases = [
        {
            "name": "Test URL 1",
            "input": {"url": "http://secure-login-account-verification.com"}
        },
        {
            "name": "Test URL 2 (Safe URL)",
            "input": {"url": "https://www.google.com"}
        },
        {
            "name": "Test Email 1",
            "input": {
                "sender": "support@paypal.com",
                "receiver": "user@gmail.com",
                "subject": "Verify Your Account",
                "body": "Click the link to secure your account: http://paypal-secure.com",
                "url": "http://paypal-secure.com"
            }
        },
        {
            "name": "Test Email 2 (Legitimate)",
            "input": {
                "sender": "noreply@github.com",
                "receiver": "dev@gmail.com",
                "subject": "Your GitHub report",
                "body": "Your weekly report is ready: https://github.com",
                "url": "https://github.com"
            }
        },
        {
            "name": "Test SMS 1",
            "input": {
                "sender": "BankAlert",
                "body": "Your OTP is 123456. Verify here: http://tinyurl.com/otp",
                "url": "http://tinyurl.com/otp"
            }
        },
        {
            "name": "Test SMS 2 (Safe)",
            "input": {
                "sender": "BankAlert",
                "body": "Your OTP is 123456. Check your account at https://www.bank.com",
                "url": "https://www.bank.com"
            }
        },
        {
            "name": "Test URL 3 (Phishing - Fake Banking)",
            "input": {
                "url": "http://bankofamerica-login-secure-update.com"
            }
        },
        {
            "name": "Test URL 4 (Legitimate News Site)",
            "input": {
                "url": "https://www.bbc.com/news"
            }
        },
        {
            "name": "Test SMS 3 (Phishing - Gift Scam)",
            "input": {
                "sender": "AmazonGift",
                "body": "Congratulations! You've won a $500 gift card. Claim now: http://amz-rewards-claim.com",
                "url": "http://amz-rewards-claim.com"
            }
        },
        {
            "name": "Test SMS 4 (Safe Delivery Update)",
            "input": {
                "sender": "FedEx",
                "body": "Your package has been shipped. Track here: https://www.fedex.com/track",
                "url": "https://www.fedex.com/track"
            }
        },
        {
            "name": "Test URL 5 (Phishing - Fake Social Media)",
            "input": {
                "url": "http://instagram-login-reset-password.com"
            }
        },
        {
            "name": "Test SMS 5 (Safe Bank Notification)",
            "input": {
                "sender": "HDFCBank",
                "body": "Your account balance is updated. Login securely: https://www.hdfcbank.com",
                "url": "https://www.hdfcbank.com"
            }
        }
    ]

    print("\n--- Running Test Cases ---\n")
    for idx, case in enumerate(test_cases, start=1):
        result_json = analyze_input(case["input"])
        result = json.loads(result_json)
        status = "⚠️ Phishing Detected" if result["model_prediction"] == "phishing" else "✅ Legitimate"
        print(f"Test Case {idx}: {case['name']}")
        print(f"Prediction: {result['model_prediction'].upper()} ({status})")
        print(f"Confidence: {result['prediction_confidence']}")
        print(f"Sender: {result.get('sender','')}")
        print(f"Receiver: {result.get('receiver','')}")
        print(f"Subject: {result.get('subject','')}")
        print(f"Body: {result.get('body','')}")
        print(f"URLs: {result.get('urls','')}")
        print(f"Feature Contributions: {result['feature_contributions']}")
        print("-" * 80)