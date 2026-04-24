import pytest
from fastapi import HTTPException

from app import dependencies_auth


def test_read_bearer_token_requires_authorization_header():
    with pytest.raises(HTTPException) as exc_info:
        dependencies_auth._read_bearer_token(None)

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "missing authorization header"


def test_read_bearer_token_rejects_invalid_prefix():
    with pytest.raises(HTTPException) as exc_info:
        dependencies_auth._read_bearer_token("Token abc")

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "invalid authorization header"


def test_get_current_user_id_requires_subject(monkeypatch):
    monkeypatch.setattr(dependencies_auth, "get_current_user", lambda authorization=None: {})

    with pytest.raises(HTTPException) as exc_info:
        dependencies_auth.get_current_user_id("Bearer token")

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "invalid token subject"


def test_get_current_user_requires_supabase_configuration(monkeypatch):
    monkeypatch.setattr(dependencies_auth.os, "getenv", lambda _key, default="": default)

    with pytest.raises(HTTPException) as exc_info:
        dependencies_auth.get_current_user("Bearer token")

    assert exc_info.value.status_code == 500
    assert exc_info.value.detail == "supabase auth config missing"
