from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Agentic AI Travel Companion"
    environment: str = "development"
    frontend_origin: str = "http://localhost:3000"

    mongodb_uri: str = Field(default="")
    mongo_url: str = ""
    mongodb_database: str = "agentic_travel"

    jwt_secret_key: str = "replace-with-a-long-random-secret-before-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    encryption_key: str = ""

    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""

    # Compatibility with the FastAPI-Mail style names you added.
    mail_username: str = ""
    mail_password: str = ""
    mail_from: str = ""
    mail_server: str = ""
    mail_port: int = 587

    openweather_api_key: str = ""
    tomtom_api_key: str = ""
    openrouteservice_api_key: str = ""
    osm_user_agent: str = "AgenticAITravelCompanion/1.0"

    model_config = SettingsConfigDict(
        env_file=("../.env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def mongo_configured(self) -> bool:
        value = self.effective_mongodb_uri.strip().lower()
        return bool(value and "garbage" not in value and "<username>" not in value)

    @property
    def effective_mongodb_uri(self) -> str:
        return self.mongodb_uri or self.mongo_url

    @property
    def effective_smtp_host(self) -> str:
        if self.mail_username or self.mail_password or self.mail_from:
            return self.mail_server or "smtp.gmail.com"
        return self.smtp_host

    @property
    def effective_smtp_port(self) -> int:
        if self.mail_username or self.mail_password or self.mail_from:
            return self.mail_port
        return self.smtp_port

    @property
    def effective_smtp_username(self) -> str:
        return self.mail_username or self.smtp_username

    @property
    def effective_smtp_password(self) -> str:
        return self.mail_password or self.smtp_password

    @property
    def effective_smtp_from_email(self) -> str:
        return self.mail_from or self.smtp_from_email


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
