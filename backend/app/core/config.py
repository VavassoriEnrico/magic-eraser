import os
from pathlib import Path
from urllib.parse import urlparse

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / ".env")

load_dotenv()

def _validate_database_url(database_url: str) -> None:
    if os.getenv("PYTEST_CURRENT_TEST"):
        return

    parsed = urlparse(database_url)
    scheme = (parsed.scheme or "").lower()
    hostname = (parsed.hostname or "").lower()

    if scheme.startswith("sqlite"):
        raise RuntimeError("DATABASE_URL must point to Supabase Postgres, not SQLite")

    if hostname in {"localhost", "127.0.0.1", "db"}:
        raise RuntimeError("DATABASE_URL must point to Supabase Postgres, not a local database")

    if hostname and "supabase.com" not in hostname:
        raise RuntimeError("DATABASE_URL must point to a Supabase Postgres host")


#single point to access to settings. This is useful to avoid having to import os and dotenv in every file that needs to access the settings.
class Settings:
    def __init__(self) -> None:
        self.database_url = os.getenv("DATABASE_URL")
        if not self.database_url:
            raise RuntimeError("DATABASE_URL is not set")
        _validate_database_url(self.database_url)

        self.supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
        self.supabase_service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
        self.supabase_storage_bucket = os.getenv("SUPABASE_STORAGE_BUCKET", "images").strip() or "images"
        self.cors_origins = ["*"]


settings = Settings()
