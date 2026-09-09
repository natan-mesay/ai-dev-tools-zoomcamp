import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./maitreq.db")
    DB_ECHO: bool = os.getenv("DB_ECHO", "false").lower() == "true"
    API_PREFIX: str = "/api/v1"

settings = Settings()
