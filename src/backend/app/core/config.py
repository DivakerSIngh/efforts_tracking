from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    DB_CONNECTION_STRING: str
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_MINUTES: int = 480
    JWT_REFRESH_EXPIRY_DAYS: int = 7
    ALLOWED_ORIGINS: List[str] = ["http://localhost:4200"]

    # Field-level encryption key (Fernet URL-safe base64, 32-byte key)
    # Generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
    FIELD_ENCRYPTION_KEY: str

    # SMTP (Phase 8)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@efforttracker.com"
    APP_URL: str = "http://localhost:4200"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
