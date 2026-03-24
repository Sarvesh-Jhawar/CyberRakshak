import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from pathlib import Path
import re
from urllib.parse import urlparse
import string
from bs4 import BeautifulSoup

# --- Pydantic Input Models ---

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
    protocol: str = "tcp"; flag: str = "SF"; family: str = "unknown"; seddaddress: str = "unknown"
    expaddress: str = "unknown"; ip_address: str = Field("127.0.0.1", alias="ip address")
    user_agent: str = Field("unknown", alias="user-agent")
    geolocation: str = "unknown"; event_description: str = Field("unknown", alias="event description")
    duration: int = 0; src_bytes: int = 0; dst_bytes: int = 0; land: int = 0; wrong_fragment: int = 0
    urgent: int = 0; hot: int = 0; num_failed_logins: int = 0; logged_in: int = 0
    num_compromised: int = 0; root_shell: int = 0; su_attempted: int = 0; num_root: int = 0
    count: int = 0; srv_count: int = 0; serror_rate: float = 0.0; srv_serror_rate: float = 0.0
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


class MLModelManager:
    def __init__(self):
        self.models_path = Path(__file__).parent.parent.parent.parent / "models"
        self.models = {}
        self.load_models()
    
    def load_models(self):
        """Load all available ML models"""
        try:
            # Phishing
            phishing_model_path = self.models_path / "phishing/models/phishing_rf_model.pkl"
            phishing_features_path = self.models_path / "phishing/models/phishing_features.pkl"
            self.models["phishing_model"] = joblib.load(phishing_model_path)
            self.models["phishing_features"] = joblib.load(phishing_features_path)
            print("Phishing detection model loaded successfully")

            # Malware
            malware_model_path = self.models_path / "malware/models/malware_rf_model.pkl"
            malware_features_path = self.models_path / "malware/models/malware_features.pkl"
            self.models["malware_model"] = joblib.load(malware_model_path)
            self.models["malware_features"] = joblib.load(malware_features_path)
            print("Malware detection model loaded successfully")

            # Ransomware
            ransomware_model_path = self.models_path / "Ransomware/models/ransomware_rf_model.pkl"
            self.models["ransomware_model"] = joblib.load(ransomware_model_path)
            print("Ransomware detection model loaded successfully")

            # Networking
            networking_model_path = self.models_path / "networking/models/network_rf_model.pkl"
            self.models["networking_model"] = joblib.load(networking_model_path)
            print("Networking detection model loaded successfully")

            # Zero-Day
            zero_day_model_path = self.models_path / "zero_day_attack/models/zero_day_model.pkl"
            self.models["zero_day_model"] = joblib.load(zero_day_model_path)
            print("Zero-Day detection model loaded successfully")

        except Exception as e:
            print(f"Error loading ML models: {e}")

    def predict_phishing(self, data: PhishingInput):
        if "phishing_model" not in self.models:
            return {"error": "Phishing model not loaded."}

        try:
            feats = self._extract_phishing_features(data.dict())
            feat_array = np.array([feats.get(f, 0) for f in self.models["phishing_features"]]).reshape(1, -1)
        except Exception as e:
            return {"error": f"Feature extraction failed: {e}"}

        model = self.models["phishing_model"]
        pred_prob = model.predict_proba(feat_array)[0][1]
        prediction = "phishing" if pred_prob >= 0.5 else "legitimate"

        return {
            "prediction": prediction,
            "confidence": round(float(pred_prob), 4),
            "features": feats.to_dict()
        }

    def predict_malware(self, data: MalwareInput):
        if "malware_model" not in self.models:
            return {"error": "Malware model not loaded."}

        model = self.models["malware_model"]
        features = self.models["malware_features"]
        
        input_dict = data.dict()
        feat_array = np.array([input_dict.get(f, 0) for f in features]).reshape(1, -1)
        
        pred_prob = model.predict_proba(feat_array)[0][1]
        prediction = "malware" if pred_prob >= 0.5 else "benign"

        return {
            "prediction": prediction,
            "confidence": round(float(pred_prob), 4)
        }

    def predict_ransomware(self, data: RansomwareInput):
        if "ransomware_model" not in self.models:
            return {"error": "Ransomware model not loaded."}
        
        model = self.models["ransomware_model"]
        input_df = pd.DataFrame([data.dict()])

        try:
            preprocessor = model.named_steps.get('preprocessor')
            if preprocessor and hasattr(preprocessor, 'transformers_'):
                numeric_cols_from_model = [
                    col for name, _, cols in preprocessor.transformers_ if name == 'num' for col in cols
                ]

                for col in numeric_cols_from_model:
                    if col in input_df.columns:
                        input_df[col] = pd.to_numeric(input_df[col], errors='coerce').fillna(0).astype(np.float64)

            pred_prob_all = model.predict_proba(input_df)
            pred_prob = pred_prob_all[0][1]
            prediction = "malicious" if pred_prob >= 0.5 else "benign"
        except Exception as e:
            return {"error": f"Prediction failed: {e}"}

        return {
            "prediction": prediction,
            "confidence": round(float(pred_prob), 4)
        }

    def predict_networking(self, data: NetworkingInput):
        if "networking_model" not in self.models:
            return {"error": "Networking model not loaded."}
        
        model = self.models["networking_model"]
        input_df = pd.DataFrame([data.dict()])

        try:
            pred_prob = model.predict_proba(input_df)[0][1]
            prediction = "anomaly" if pred_prob >= 0.5 else "normal"
        except Exception as e:
            return {"error": f"Prediction failed: {e}"}

        return {
            "prediction": prediction,
            "confidence": round(float(pred_prob), 4)
        }

    def predict_zero_day(self, data: ZeroDayInput):
        if "zero_day_model" not in self.models:
            return {"error": "Zero-Day model not loaded."}

        model = self.models["zero_day_model"]
        
        input_df = pd.DataFrame([data.dict(by_alias=True)])

        try:
            prediction = model.predict(input_df)[0]
            pred_probs = model.predict_proba(input_df)[0]
            
            classifier = model.named_steps['classifier']
            class_probabilities = {classifier.classes_[i]: round(float(prob), 4) for i, prob in enumerate(pred_probs)}

        except Exception as e:
            return {"error": f"Prediction failed: {e}"}

        return {
            "prediction": prediction,
            "class_probabilities": class_probabilities
        }

    def _extract_phishing_features(self, row):
        feats = {}
        if 'url' in row and pd.notna(row['url']):
            feats.update(self._extract_url_features(row['url']))
        feats.update(self._extract_text_features(row.get('subject', ''), row.get('body', '')))
        return pd.Series(feats)

    def _extract_url_features(self, url):
        if not url or pd.isna(url): return { "url_length": 0, "num_dots": 0, "num_hyphens": 0, "num_digits": 0, "has_https": 0, "has_at_symbol": 0, "num_slash": 0, "has_ip_address": 0, "contains_login": 0, "contains_verify": 0 }
        return {
            "url_length": len(url), "num_dots": url.count('.'), "num_hyphens": url.count('-'),
            "num_digits": sum(c.isdigit() for c in url), "has_https": int("https" in url.lower()),
            "has_at_symbol": int("@" in url), "num_slash": url.count('/'),
            "has_ip_address": int(bool(re.match(r"^\d{1,3}(\.\d{1,3}){3}$", urlparse(url).hostname or ""))),
            "contains_login": int("login" in url.lower()), "contains_verify": int("verify" in url.lower())
        }

    def _extract_text_features(self, subject, body):
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
        if pd.isna(subject): subject = ""
        if pd.isna(body): body = ""
        text = BeautifulSoup(str(subject) + " " + str(body), "html.parser").get_text()
        text = text.lower()
        text = text.translate(str.maketrans('', '', string.punctuation))
        tokens = [w for w in text.split() if w not in STOPWORDS]
        combined = " ".join(tokens)
        return {
            "text_length": len(combined), "num_words": len(combined.split()), "num_exclamations": combined.count('!'),
            "num_digits": sum(c.isdigit() for c in combined), "contains_login": int("login" in combined),
            "contains_verify": int("verify" in combined), "contains_password": int("password" in combined)
        }

# Global ML model manager instance
ml_manager = MLModelManager()