import httpx
from typing import Dict, Any, Optional
from ..config import settings
import logging

logger = logging.getLogger(__name__)

ML_API_BASE_URL = settings.ML_API_BASE_URL

async def get_ml_prediction(incident_category: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Calls the external ML API to get a prediction for an incident.

    Args:
        incident_category: The category of the incident (e.g., 'phishing', 'malware').
        data: The data to be sent to the ML model for prediction.

    Returns:
        A dictionary containing the prediction result, or None if an error occurs.
    """
    if not ML_API_BASE_URL:
        logger.warning("ML_API_BASE_URL is not configured. Skipping ML prediction.")
        return None

    # Map incident category to ML API endpoint path
    endpoint_map = {
        "phishing": "predict/phishing",
        "malware": "predict/malware",
        "ransomware": "predict/ransomware", # Assuming 'Ransomware' in data maps to this
        "network-intrusion": "predict/networking",
        "zero-day": "predict/zero-day",
    }

    endpoint_path = endpoint_map.get(incident_category.lower())

    if not endpoint_path:
        logger.info(f"No ML model available for category: {incident_category}. Skipping prediction.")
        return None

    url = f"{ML_API_BASE_URL}/{endpoint_path}"
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json=data)
            response.raise_for_status()  # Raise an exception for bad status codes (4xx or 5xx)
            return response.json()
    except httpx.RequestError as e:
        logger.error(f"Error calling ML API at {url}: {e}")
        return None
    except Exception as e:
        logger.error(f"An unexpected error occurred during ML prediction for {incident_category}: {e}")
        return None