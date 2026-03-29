from pydantic_settings import BaseSettings
from typing import Optional
import os
from dotenv import load_dotenv
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=BASE_DIR / ".env")

class Settings(BaseSettings):
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "CyberRakshak API"
    VERSION: str = "1.0.0"

    # LLM API Keys
    MISTRAL_API_KEY: str
    GROQ_API_KEY: Optional[str] = None

    # Security
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/cyberrakshak")
    
    # CORS Settings
    BACKEND_CORS_ORIGINS: Optional[str] = None

    @property
    def cors_origins(self) -> list[str]:
        if self.BACKEND_CORS_ORIGINS:
            return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(',')]
        return []
    
    # Database settings are above
    
    # ML Models Path
    ML_MODELS_PATH: str = "../models"
    ML_API_BASE_URL: str = "http://127.0.0.1:8000"
    
    # Debug Mode
    DEBUG: bool = True
    
    class Config:
        case_sensitive = True

settings = Settings()