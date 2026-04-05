import secrets
from typing import Literal, Optional

from pydantic import (
    PostgresDsn,
    computed_field,
)
from pydantic_core import MultiHostUrl
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_ignore_empty=True,
        extra="ignore",
    )
    
    # Core API settings
    PROJECT_NAME: str = "Arif Alta API"
    ENVIRONMENT: Literal["local", "staging", "production"] = "local"
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ALGORITHM: str = "HS256"
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173", "http://localhost:8000", "http://localhost:8080"]
    
    ADMIN_PASSWORD: str = "bariweb_secret_2026"
    JWT_SECRET_KEY: str = "your-super-secret-jwt-key-change-me"
    
    # 60 minutes * 24 hours * 8 days = 8 days
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8

    # Postgres Database settings
    POSTGRES_SERVER: str
    POSTGRES_PORT: int
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str

    # RAG Pipeline URL
    RAG_API_URL: str = "http://localhost:8001"

    # Milvus settings
    MILVUS_SERVER: Optional[str] = None
    MILVUS_PORT: Optional[int] = None
    MILVUS_USER: Optional[str] = None
    MILVUS_PASSWORD: Optional[str] = None
    MILVUS_DB: Optional[str] = "default"
    MILVUS_COLLECTION: str = "bariweb_elements"

    # Embeddings (ALEM AI)
    ALEM_EMBEDDINGS_API_KEY: Optional[str] = None
    ALEM_EMBEDDINGS_BASE_URL: str = "https://llm.alem.ai/v1"
    ALEM_EMBEDDINGS_MODEL: str = "text-1024"
    ALEM_EMBEDDINGS_DIMENSION: int = 1024

    # AI & Agent settings
    KAZLLM_API_KEY: Optional[str] = None
    SPEACH_TO_TEXT_KZ_API_KEY: Optional[str] = None
    SPEACH_TO_TEXT_API_KEY: Optional[str] = None
    DEEPSEEK_OCR_API_KEY: Optional[str] = None
    QWEN3_API_KEY: Optional[str] = None
    QWEN3_BASE_URL: str = "https://llm.alem.ai/v1"

    # LangFuse settings
    LANGFUSE_SECRET_KEY: Optional[str] = None
    LANGFUSE_PUBLIC_KEY: Optional[str] = None
    LANGFUSE_BASE_URL: str = "https://a1-langfuse1.alem.ai"

    @computed_field
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> PostgresDsn:
        return MultiHostUrl.build(
            scheme="postgresql",
            username=self.POSTGRES_USER,
            password=self.POSTGRES_PASSWORD,
            host=self.POSTGRES_SERVER,
            port=self.POSTGRES_PORT,
            path=self.POSTGRES_DB,
        )


settings = Settings()  # type: ignore
