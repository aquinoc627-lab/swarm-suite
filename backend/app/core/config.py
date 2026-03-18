from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./swarm.db"
    SECRET_KEY: str = "swarm-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    LIVE_MODE: bool = False  # When True, executes real commands

    model_config = {"env_file": ".env"}


settings = Settings()
