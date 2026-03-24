import joblib
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from pathlib import Path
import re
from urllib.parse import urlparse
import string
from bs4 import BeautifulSoup

# --- 1. Setup & Configuration ---

app = FastAPI(
    title="Cyber Threat Intelligence API",
    description="An API for detecting phishing, malware, ransomware, network anomalies, and zero-day threats.",
    version="1.0.0",
)

BASE_DIR = Path(__file__).parent.resolve()
MODELS_ROOT = BASE_DIR.parent

# --- 2. Load Models and Artifacts ---

models = {}
try:
    # Phishing
    phishing_model_path = MODELS_ROOT / "phishing/models/phishing_rf_model.pkl"
    phishing_features_path = MODELS_ROOT / "phishing/models/phishing_features.pkl"
    models["phishing_model"] = joblib.load(phishing_model_path)
    models["phishing_features"] = joblib.load(phishing_features_path)

    # Malware
    malware_model_path = MODELS_ROOT / "malware/models/malware_rf_model.pkl"
    malware_features_path = MODELS_ROOT / "malware/models/malware_features.pkl"
    models["malware_model"] = joblib.load(malware_model_path)
    models["malware_features"] = joblib.load(malware_features_path)

    # Ransomware
    ransomware_model_path = MODELS_ROOT / "Ransomware/models/ransomware_rf_model.pkl"
    models["ransomware_model"] = joblib.load(ransomware_model_path)

    # Networking
    networking_model_path = MODELS_ROOT / "networking/models/network_rf_model.pkl"
    models["networking_model"] = joblib.load(networking_model_path)

    # Zero-Day
    zero_day_model_path = MODELS_ROOT / "zero_day_attack/models/zero_day_model.pkl"
    models["zero_day_model"] = joblib.load(zero_day_model_path)

except FileNotFoundError as e:
    print(f"FATAL: Could not load a model - {e}. Please ensure all models are trained and located in the correct 'models' subdirectories.")
    # In a production app, you might want to exit or disable endpoints.

# --- 3. Phishing Model Helpers ---

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

def clean_text(text):
    if pd.isna(text): return ""
    text = BeautifulSoup(str(text), "html.parser").get_text()
    text = text.lower()
    text = text.translate(str.maketrans('', '', string.punctuation))
    tokens = [w for w in text.split() if w not in STOPWORDS]
    return " ".join(tokens)

def extract_url_features(url):
    if not url or pd.isna(url): return { "url_length": 0, "num_dots": 0, "num_hyphens": 0, "num_digits": 0, "has_https": 0, "has_at_symbol": 0, "num_slash": 0, "has_ip_address": 0, "contains_login": 0, "contains_verify": 0 }
    return {
        "url_length": len(url), "num_dots": url.count('.'), "num_hyphens": url.count('-'),
        "num_digits": sum(c.isdigit() for c in url), "has_https": int("https" in url.lower()),
        "has_at_symbol": int("@" in url), "num_slash": url.count('/'),
        "has_ip_address": int(bool(re.match(r"^\d{1,3}(\.\d{1,3}){3}$", urlparse(url).hostname or ""))),
        "contains_login": int("login" in url.lower()), "contains_verify": int("verify" in url.lower())
    }

def extract_text_features(subject, body):
    combined = clean_text(str(subject) + " " + str(body))
    return {
        "text_length": len(combined), "num_words": len(combined.split()), "num_exclamations": combined.count('!'),
        "num_digits": sum(c.isdigit() for c in combined), "contains_login": int("login" in combined),
        "contains_verify": int("verify" in combined), "contains_password": int("password" in combined)
    }

def extract_phishing_features(row):
    feats = {}
    if 'url' in row and pd.notna(row['url']):
        feats.update(extract_url_features(row['url']))
    feats.update(extract_text_features(row.get('subject', ''), row.get('body', '')))
    return pd.Series(feats)

# --- 4. Pydantic Input Models ---

class PhishingInput(BaseModel):
    subject: Optional[str] = ""
    body: Optional[str] = ""
    url: Optional[str] = ""

class MalwareInput(BaseModel):
    millisecond: int = 0; state: int = 0; usage_counter: int = 0; prio: int = 0
    static_prio: int = 0; normal_prio: int = 0; policy: int = 0; vm_pgoff: int = 0
    vm_truncate_count: int = 0; task_size: int = 0; cached_hole_size: int = 0
    free_area_cache: int = 0; mm_users: int = 0; map_count: int = 0; hiwater_rss: int = 0
    total_vm: int = 0; shared_vm: int = 0; exec_vm: int = 0; reserved_vm: int = 0
    nr_ptes: int = 0; end_data: int = 0; last_interval: int = 0; nvcsw: int = 0
    nivcsw: int = 0; min_flt: int = 0; maj_flt: int = 0; fs_excl_counter: int = 0; lock: int = 0
    utime: int = 0; stime: int = 0; gtime: int = 0; cgtime: int = 0; signal_nvcsw: int = 0

class RansomwareInput(BaseModel):
    # NOTE: This model has been expanded to include all features the trained model expects.
    ApiVector: Optional[float] = 0.0
    DllVector: Optional[float] = 0.0
    NumberOfSections: Optional[float] = 0.0
    CreationYear: Optional[float] = 0.0
    resources_mean_entropy: Optional[float] = 0.0
    sus_sections: Optional[float] = 0.0
    packer: Optional[float] = 0.0
    E_text: Optional[float] = 0.0
    E_data: Optional[float] = 0.0
    OsVersion: Optional[str] = "unknown"
    Subsystem: Optional[str] = "unknown"
    Machine: Optional[str] = "unknown"
    registry_delete: Optional[float] = 0.0
    MinorLinkerVersion: Optional[float] = 0.0
    Magic: Optional[float] = 0.0
    SizeofStackReserve: Optional[float] = 0.0
    ExportRVA: Optional[float] = 0.0
    apis: Optional[float] = 0.0
    rdata_VirtualSize: Optional[float] = 0.0
    min_extra_paragraphs: Optional[float] = 0.0
    ExportSize: Optional[float] = 0.0
    rdata_Characteristics: Optional[float] = 0.0
    IatVRA: Optional[float] = 0.0
    magic_number: Optional[float] = 0.0
    PEType: Optional[float] = 0.0
    LoaderFlags: Optional[float] = 0.0
    pages_in_file: Optional[float] = 0.0
    text_VirtualAddress: Optional[float] = 0.0
    rdata_VirtualAddress: Optional[float] = 0.0
    SizeofStackCommit: Optional[float] = 0.0
    init_ss_value: Optional[float] = 0.0
    oem_identifier: Optional[float] = 0.0
    SizeOfUninitializedData: Optional[float] = 0.0
    SectionAlignment: Optional[float] = 0.0
    MajorImageVersion: Optional[float] = 0.0
    MachineType: Optional[str] = "unknown"
    text_PointerToLineNumbers: Optional[float] = 0.0
    max_extra_paragraphs: Optional[float] = 0.0
    rdata_PointerToRawData: Optional[float] = 0.0
    size_of_header: Optional[float] = 0.0
    text_PointerToRelocations: Optional[float] = 0.0
    OperatingSystemVersion: Optional[float] = 0.0
    BitcoinAddresses: Optional[float] = 0.0
    SizeOfInitializedData: Optional[float] = 0.0
    BaseOfData: Optional[float] = 0.0
    Family: Optional[str] = "unknown"
    SizeOfStackReserve: Optional[float] = 0.0
    processes_suspicious: Optional[float] = 0.0
    MajorLinkerVersion: Optional[float] = 0.0
    registry_write: Optional[float] = 0.0
    network_threats: Optional[float] = 0.0
    init_sp_value: Optional[float] = 0.0
    SizeOfHeaders: Optional[float] = 0.0
    files_malicious: Optional[float] = 0.0
    registry_total: Optional[float] = 0.0
    SizeOfCode: Optional[float] = 0.0
    dlls_calls: Optional[float] = 0.0
    MajorOSVersion: Optional[float] = 0.0
    text_Characteristics: Optional[float] = 0.0
    processes_monitored: Optional[float] = 0.0
    files_suspicious: Optional[float] = 0.0
    AddressOfEntryPoint: Optional[float] = 0.0
    DllCharacteristics_y: Optional[float] = 0.0
    Category: Optional[str] = "unknown"
    text_SizeOfRawData: Optional[float] = 0.0
    EntryPoint: Optional[float] = 0.0
    DebugRVA: Optional[float] = 0.0
    text_VirtualSize: Optional[float] = 0.0
    Class: Optional[float] = 0.0
    init_cs_value: Optional[float] = 0.0
    total_procsses: Optional[float] = 0.0
    address_of_ne_header: Optional[float] = 0.0
    ImageVersion: Optional[float] = 0.0
    DebugSize: Optional[float] = 0.0
    files_unknown: Optional[float] = 0.0
    registry_read: Optional[float] = 0.0
    file_extension: Optional[str] = "unknown"
    rdata_SizeOfRawData: Optional[float] = 0.0
    files_text: Optional[float] = 0.0
    ImageBase: Optional[float] = 0.0
    init_ip_value: Optional[float] = 0.0
    network_connections: Optional[float] = 0.0
    text_PointerToRawData: Optional[float] = 0.0
    FileAlignment: Optional[float] = 0.0
    network_dns: Optional[float] = 0.0
    processes_malicious: Optional[float] = 0.0
    SizeOfImage: Optional[float] = 0.0
    rdata_PointerToRelocations: Optional[float] = 0.0
    SizeofHeapReserve: Optional[float] = 0.0
    SizeofHeapCommit: Optional[float] = 0.0
    DllCharacteristics_x: Optional[float] = 0.0
    network_http: Optional[float] = 0.0
    rdata_PointerToLineNumbers: Optional[float] = 0.0
    over_lay_number: Optional[float] = 0.0
    bytes_on_last_page: Optional[float] = 0.0
    ResourceSize: Optional[float] = 0.0
    relocations: Optional[float] = 0.0
    Checksum: Optional[float] = 0.0
    BaseOfCode: Optional[float] = 0.0

class NetworkingInput(BaseModel):
    duration: int = 0; protocol_type: str = "tcp"; service: str = "http"; flag: str = "SF"
    src_bytes: int = 0; dst_bytes: int = 0; land: int = 0; wrong_fragment: int = 0
    urgent: int = 0; hot: int = 0; num_failed_logins: int = 0; logged_in: int = 0
    num_compromised: int = 0; root_shell: int = 0; su_attempted: int = 0; num_root: int = 0
    num_file_creations: int = 0; num_shells: int = 0; num_access_files: int = 0
    num_outbound_cmds: int = 0; is_host_login: int = 0; is_guest_login: int = 0
    count: int = 0; srv_count: int = 0; serror_rate: float = 0.0; srv_serror_rate: float = 0.0
    rerror_rate: float = 0.0; srv_rerror_rate: float = 0.0; same_srv_rate: float = 0.0
    diff_srv_rate: float = 0.0; srv_diff_host_rate: float = 0.0; dst_host_count: int = 0
    dst_host_srv_count: int = 0; dst_host_same_srv_rate: float = 0.0
    dst_host_diff_srv_rate: float = 0.0; dst_host_same_src_port_rate: float = 0.0
    dst_host_srv_diff_host_rate: float = 0.0; dst_host_serror_rate: float = 0.0
    dst_host_srv_serror_rate: float = 0.0; dst_host_rerror_rate: float = 0.0
    dst_host_srv_rerror_rate: float = 0.0

class ZeroDayInput(BaseModel):
    # NOTE: This is a partial list. You should expand it with all features from your dataset.
    protocol: str = "tcp"; flag: str = "SF"; family: str = "unknown"; seddaddress: str = "unknown"
    expaddress: str = "unknown"; ip_address: str = Field("127.0.0.1", alias="ip address")
    user_agent: str = Field("unknown", alias="user-agent")
    geolocation: str = "unknown"; event_description: str = Field("unknown", alias="event description")
    duration: int = 0; src_bytes: int = 0; dst_bytes: int = 0; land: int = 0; wrong_fragment: int = 0
    urgent: int = 0; hot: int = 0; num_failed_logins: int = 0; logged_in: int = 0
    num_compromised: int = 0; root_shell: int = 0; su_attempted: int = 0; num_root: int = 0
    count: int = 0; srv_count: int = 0; serror_rate: float = 0.0; srv_serror_rate: float = 0.0

    # --- ADDED MISSING COLUMNS TO MATCH THE TRAINED MODEL ---
    anomaly_score: float = Field(0.0, alias="anomaly score")
    session_id: str = Field("unknown", alias="session id")
    time: int = 0
    error_code: int = Field(0, alias="error code")
    logistics_id: str = Field("unknown", alias="logistics id")
    number_of_packets: int = Field(0, alias="number of packets")
    netflow_bytes: int = Field(0, alias="netflow bytes")
    response_time: float = Field(0.0, alias="response time")
    data_transfer_rate: float = Field(0.0, alias="data transfer rate")
    clusters: int = 0
    port: int = 0
    prediction: str = "unknown"
    usd: float = 0.0
    application_layer_data: str = Field("unknown", alias="application layer data")
    payload_size: int = Field(0, alias="payload size")
    btc: float = 0.0

# --- 5. API Endpoints ---

@app.get("/", tags=["Health Check"])
def read_root():
    """A simple health check endpoint."""
    return {"message": "Cyber Threat Intelligence API is running."}


@app.post("/predict/phishing", tags=["Predictions"])
def predict_phishing(data: PhishingInput):
    """Predicts if an email/URL is phishing."""
    if "phishing_model" not in models:
        raise HTTPException(status_code=503, detail="Phishing model not loaded.")

    try:
        feats = extract_phishing_features(data.dict())
        feat_array = np.array([feats.get(f, 0) for f in models["phishing_features"]]).reshape(1, -1)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Feature extraction failed: {e}")

    model = models["phishing_model"]
    pred_prob = model.predict_proba(feat_array)[0][1]
    prediction = "phishing" if pred_prob >= 0.5 else "legitimate"

    return {
        "prediction": prediction,
        "confidence": round(float(pred_prob), 4),
        "features": feats.to_dict()
    }


@app.post("/predict/malware", tags=["Predictions"])
def predict_malware(data: MalwareInput):
    """Predicts if a process is malware based on system features."""
    if "malware_model" not in models:
        raise HTTPException(status_code=503, detail="Malware model not loaded.")

    model = models["malware_model"]
    features = models["malware_features"]
    
    input_dict = data.dict()
    feat_array = np.array([input_dict.get(f, 0) for f in features]).reshape(1, -1)
    
    pred_prob = model.predict_proba(feat_array)[0][1]
    prediction = "malware" if pred_prob >= 0.5 else "benign"

    return {
        "prediction": prediction,
        "confidence": round(float(pred_prob), 4)
    }


@app.post("/predict/ransomware", tags=["Predictions"])
def predict_ransomware(data: RansomwareInput):
    """Predicts if a file is ransomware based on PE features."""
    if "ransomware_model" not in models:
        raise HTTPException(status_code=503, detail="Ransomware model not loaded.")
    
    model = models["ransomware_model"]
    input_df = pd.DataFrame([data.dict()])

    try:
        # --- FINAL, ROBUST FIX for Training-Serving Skew ---
        # This error happens when the model's preprocessor (e.g., StandardScaler)
        # receives data of a different type than it was trained on (e.g., a string for a numeric column).
        # The fix is to inspect the loaded model to find which columns it expects to be numeric,
        # and then force those columns in the input data to be numeric.

        preprocessor = model.named_steps.get('preprocessor')
        if preprocessor and hasattr(preprocessor, 'transformers_'):
            # 1. Get the list of numeric column names from the fitted preprocessor.
            numeric_cols_from_model = [
                col for name, _, cols in preprocessor.transformers_ if name == 'num' for col in cols
            ]

            # 2. For each column the model expects to be numeric, ensure it is numeric.
            for col in numeric_cols_from_model:
                if col in input_df.columns:
                    input_df[col] = pd.to_numeric(input_df[col], errors='coerce').fillna(0).astype(np.float64)

        pred_prob_all = model.predict_proba(input_df)

        # Assumes class 1 is malicious
        pred_prob = pred_prob_all[0][1]
        prediction = "malicious" if pred_prob >= 0.5 else "benign"
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction failed: {e}")

    return {
        "prediction": prediction,
        "confidence": round(float(pred_prob), 4)
    }


@app.post("/predict/networking", tags=["Predictions"])
def predict_networking(data: NetworkingInput):
    """Predicts if network traffic is an anomaly."""
    if "networking_model" not in models:
        raise HTTPException(status_code=503, detail="Networking model not loaded.")
    
    model = models["networking_model"]
    input_df = pd.DataFrame([data.dict()])

    try:
        # Assumes class 1 is anomaly
        pred_prob = model.predict_proba(input_df)[0][1]
        prediction = "anomaly" if pred_prob >= 0.5 else "normal"
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction failed: {e}")

    return {
        "prediction": prediction,
        "confidence": round(float(pred_prob), 4)
    }


@app.post("/predict/zero-day", tags=["Predictions"])
def predict_zero_day(data: ZeroDayInput):
    """Predicts the threat level of a network event."""
    if "zero_day_model" not in models:
        raise HTTPException(status_code=503, detail="Zero-Day model not loaded.")

    model = models["zero_day_model"]
    
    # Pydantic's `alias` allows us to handle feature names with spaces
    input_df = pd.DataFrame([data.dict(by_alias=True)])

    try:
        prediction = model.predict(input_df)[0]
        pred_probs = model.predict_proba(input_df)[0]
        
        # Create a dictionary of class probabilities
        classifier = model.named_steps['classifier']
        class_probabilities = {classifier.classes_[i]: round(float(prob), 4) for i, prob in enumerate(pred_probs)}

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction failed: {e}")

    return {
        "prediction": prediction,
        "class_probabilities": class_probabilities
    }


# To run the app:
# 1. Make sure you are in the directory containing the 'api' and 'models' folders.
# 2. Run the command in your terminal: uvicorn api.main:app --reload

if __name__ == "__main__":
    import uvicorn
    # This allows running the app directly for debugging, e.g. `python api/main.py`
    # For production, use the uvicorn command.
    print("--- Starting API Server ---")
    print("Access documentation at http://127.0.0.1:8000/docs")
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)