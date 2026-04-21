import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from fastapi import Header, HTTPException


def _read_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="missing authorization header")

    prefix = "Bearer "
    if not authorization.startswith(prefix):
        raise HTTPException(status_code=401, detail="invalid authorization header")

    token = authorization[len(prefix):].strip()
    if not token:
        raise HTTPException(status_code=401, detail="missing bearer token")
    return token


def get_current_user(authorization: str | None = Header(default=None)) -> dict:
    token = _read_bearer_token(authorization)

    supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
    supabase_api_key = os.getenv("SUPABASE_ANON_KEY", "").strip() or os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    if not supabase_url or not supabase_api_key:
        raise HTTPException(status_code=500, detail="supabase auth config missing")

    request = Request(
        url=f"{supabase_url}/auth/v1/user",
        headers={
            "Authorization": f"Bearer {token}",
            "apikey": supabase_api_key,
        },
        method="GET",
    )

    try:
        with urlopen(request, timeout=3) as response:
            body = response.read()
    except HTTPError:
        raise HTTPException(status_code=401, detail="invalid or expired token")
    except URLError:
        raise HTTPException(status_code=503, detail="supabase auth unavailable")

    try:
        user = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=401, detail="invalid token payload")

    if not isinstance(user, dict):
        raise HTTPException(status_code=401, detail="invalid token payload")

    return user


def get_current_user_id(authorization: str | None = Header(default=None)) -> str:
    user = get_current_user(authorization)
    user_id = user.get("id") or user.get("sub")
    if not isinstance(user_id, str) or not user_id.strip():
        raise HTTPException(status_code=401, detail="invalid token subject")

    return user_id
