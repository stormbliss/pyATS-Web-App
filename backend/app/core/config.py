from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "PyATS Web App"
    DEBUG: bool = False
    
    # Database
    DATABASE_URL: str = "sqlite:///./data/pyats.db"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Paths
    TESTBED_DIR: str = "./data/testbeds"
    JOBS_DIR: str = "./data/jobs"
    SNAPSHOTS_DIR: str = "./data/snapshots"
    
    class Config:
        env_file = ".env"

settings = Settings()

# Ensure directories exist
os.makedirs("./data/testbeds", exist_ok=True)
os.makedirs("./data/jobs", exist_ok=True)
os.makedirs("./data/snapshots", exist_ok=True)
