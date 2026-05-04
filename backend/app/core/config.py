import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    APP_NAME: str = "Agentic Travel AI"
    VERSION: str = "1.0"

    # API Keys (optional now, useful later)
    OPENWEATHER_API_KEY: str = os.getenv("OPENWEATHER_API_KEY", "")
    MAPS_API_KEY: str = os.getenv("MAPS_API_KEY", "")

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "mysecretkey")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

settings = Settings()