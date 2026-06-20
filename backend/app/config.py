"""Central configuration for the MentyTarget backend."""
from __future__ import annotations

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="MENTY_", env_file=".env", extra="ignore")

    # OpenTargets public GraphQL API (no auth required)
    opentargets_api: str = "https://api.platform.opentargets.org/api/v4/graphql"

    # How many candidate targets to pull from OpenTargets per disease
    max_candidates: int = 100

    # Where the trained model is stored on disk
    model_path: Path = Path(__file__).resolve().parent.parent / "models" / "ranker.joblib"

    # HTTP timeout (seconds) for external calls
    http_timeout: float = 30.0


settings = Settings()
