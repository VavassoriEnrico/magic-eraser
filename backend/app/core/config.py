import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / ".env")

load_dotenv()

#single point to access to settings. This is useful to avoid having to import os and dotenv in every file that needs to access the settings.
class Settings:
    def __init__(self) -> None:
        self.database_url = os.getenv("DATABASE_URL")
        if not self.database_url:
            raise RuntimeError("DATABASE_URL is not set")

        self.supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
        self.supabase_service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
        self.supabase_storage_bucket = os.getenv("SUPABASE_STORAGE_BUCKET", "images").strip() or "images"

        self.uploads_dir = Path(__file__).resolve().parents[2] / "uploads"
        self.cors_origins = ["*"]


settings = Settings()
