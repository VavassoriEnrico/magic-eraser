import os
from pathlib import Path

import pytest
from sqlalchemy import event

TEST_DB_PATH = Path("/tmp/magic_eraser_pytest.sqlite3")
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")
os.environ.setdefault("SUPABASE_ANON_KEY", "test-anon-key")

import app.db.init_db as init_db_module

init_db_module.init_db = lambda: None

from app.core.config import settings
from app.db.session import Base, SessionLocal, engine
from app.main import app


@event.listens_for(engine, "connect")
def _enable_sqlite_foreign_keys(dbapi_connection, _connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


@pytest.fixture(autouse=True)
def reset_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def isolated_uploads_dir(tmp_path, monkeypatch):
    uploads_dir = tmp_path / "uploads"
    uploads_dir.mkdir()
    monkeypatch.setattr(settings, "uploads_dir", uploads_dir)
    yield uploads_dir


@pytest.fixture
def db_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def test_user_id():
    return "123e4567-e89b-12d3-a456-426614174000"


@pytest.fixture
def test_user(test_user_id):
    return {
        "id": test_user_id,
        "email": "tester@example.com",
    }
