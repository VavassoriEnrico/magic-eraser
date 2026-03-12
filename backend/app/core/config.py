import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()


class Settings:
    def __init__(self) -> None:
        self.database_url = os.getenv("DATABASE_URL")
        if not self.database_url:
            raise RuntimeError("DATABASE_URL is not set")

        self.uploads_dir = Path(__file__).resolve().parents[2] / "uploads"
        self.cors_origins = ["*"]


settings = Settings()
