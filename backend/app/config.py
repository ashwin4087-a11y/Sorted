from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Sorted API"
    environment: str = "development"
    database_url: str = "postgresql+psycopg://sorted:YourNewPassword123%21@localhost:5432/sorted"
    llm_api_key: str = ""
    llm_base_url: str = ""
    llm_model: str = ""
    frontend_origins: str = "http://localhost:5173"
    document_encryption_key: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.frontend_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
