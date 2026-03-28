import base64
import mimetypes
from urllib.parse import urlparse

from fastapi import HTTPException

from app.core.config import settings

#this resolves the input image url to a format that can be used by (in our case) fal.
#if Data URI is provided, its returned as is.

LOCAL_HOSTS = {"127.0.0.1", "localhost"}


def resolve_image_input(input_image_url: str) -> str:
    source = input_image_url.strip()
    if not source:
        raise HTTPException(status_code=400, detail="input image url is required")

    if source.startswith("data:"):
        return source

    parsed = urlparse(source)

    if source.startswith("/uploads/"):
        return _build_data_uri_from_uploads_path(source)

    if parsed.scheme in {"http", "https"}:
        hostname = (parsed.hostname or "").strip().lower()

        if hostname in LOCAL_HOSTS:
            return _build_data_uri_from_uploads_path(parsed.path)

        return source

    raise HTTPException(status_code=400, detail="unsupported input image source")


def _build_data_uri_from_uploads_path(public_uploads_path: str) -> str:
    if not public_uploads_path.startswith("/uploads/"):
        raise HTTPException(status_code=400, detail="input image must be under /uploads")

    relative_path = public_uploads_path.removeprefix("/uploads/").lstrip("/")
    file_path = (settings.uploads_dir / relative_path).resolve()
    uploads_root = settings.uploads_dir.resolve()

    try:
        file_path.relative_to(uploads_root)
    except ValueError:
        raise HTTPException(status_code=400, detail="invalid upload path")

    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="input image file not found")

    mime_type, _ = mimetypes.guess_type(file_path.name)
    if not mime_type:
        mime_type = "application/octet-stream"

    encoded = base64.b64encode(file_path.read_bytes()).decode("ascii")
    return f"data:{mime_type};base64,{encoded}"
