from pathlib import Path
from io import BytesIO
from urllib.error import HTTPError
from urllib.parse import quote, unquote, urlparse
from urllib.request import Request, urlopen
from uuid import UUID, uuid4

from fastapi import UploadFile
from PIL import Image, UnidentifiedImageError

from app.core.config import settings


def save_project_upload(project_id: UUID, file: UploadFile) -> tuple[str, str]:
    original_name = Path(file.filename or "upload.bin").name
    extension = Path(original_name).suffix
    stored_name = f"{uuid4().hex}{extension}"
    object_key = _build_object_key(project_id, stored_name)
    upload_bytes = file.file.read()
    content_type = (file.content_type or "").strip() or _guess_content_type(original_name, upload_bytes)
    _upload_bytes_to_supabase(object_key, upload_bytes, content_type)
    return original_name, _build_public_url(object_key)


def save_project_bytes(
    project_id: UUID,
    content: bytes,
    original_name: str,
) -> str:
    safe_name = Path(original_name).name or "upload.bin"
    extension = Path(safe_name).suffix
    stored_name = f"{uuid4().hex}{extension}"
    object_key = _build_object_key(project_id, stored_name)
    _upload_bytes_to_supabase(object_key, content, _guess_content_type(safe_name, content))
    return _build_public_url(object_key)


def delete_public_upload(public_path: str) -> None:
    path = public_path.strip()
    if not path:
        return

    object_key = _extract_bucket_object_key(path)
    if object_key:
        _delete_supabase_object(object_key)
        return

    if not path.startswith("/uploads/"):
        return
    relative_path = path.removeprefix("/uploads/").lstrip("/")
    file_path = (settings.uploads_dir / relative_path).resolve()
    uploads_root = settings.uploads_dir.resolve()
    try:
        file_path.relative_to(uploads_root)
    except ValueError:
        return

    if file_path.exists():
        file_path.unlink()


def _build_object_key(project_id: UUID, stored_name: str) -> str:
    return f"project_{project_id}/{stored_name}"


def _build_public_url(object_key: str) -> str:
    _validate_supabase_storage_config()
    encoded_key = quote(object_key, safe="/")
    return (
        f"{settings.supabase_url}/storage/v1/object/public/"
        f"{settings.supabase_storage_bucket}/{encoded_key}"
    )


def _upload_bytes_to_supabase(object_key: str, content: bytes, content_type: str) -> None:
    _validate_supabase_storage_config()
    request = Request(
        url=f"{settings.supabase_url}/storage/v1/object/{settings.supabase_storage_bucket}/{quote(object_key, safe='/')}",
        data=content,
        headers={
            "Authorization": f"Bearer {settings.supabase_service_role_key}",
            "apikey": settings.supabase_service_role_key,
            "x-upsert": "true",
            "Content-Type": content_type,
        },
        method="POST",
    )
    try:
        with urlopen(request, timeout=8):
            return
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"failed to upload file to supabase storage: {detail}") from exc
    except Exception as exc:
        raise RuntimeError("failed to upload file to supabase storage") from exc


def _delete_supabase_object(object_key: str) -> None:
    _validate_supabase_storage_config()
    request = Request(
        url=f"{settings.supabase_url}/storage/v1/object/{settings.supabase_storage_bucket}/{quote(object_key, safe='/')}",
        headers={
            "Authorization": f"Bearer {settings.supabase_service_role_key}",
            "apikey": settings.supabase_service_role_key,
        },
        method="DELETE",
    )
    try:
        with urlopen(request, timeout=5):
            return
    except Exception:
        return


def _extract_bucket_object_key(path_or_url: str) -> str | None:
    if path_or_url.startswith("/uploads/"):
        return None

    parsed = urlparse(path_or_url)
    path = parsed.path or path_or_url
    public_prefix = f"/storage/v1/object/public/{settings.supabase_storage_bucket}/"
    private_prefix = f"/storage/v1/object/{settings.supabase_storage_bucket}/"

    if path.startswith(public_prefix):
        return unquote(path.removeprefix(public_prefix))
    if path.startswith(private_prefix):
        return unquote(path.removeprefix(private_prefix))
    return None


def _validate_supabase_storage_config() -> None:
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise RuntimeError(
            "supabase storage config missing: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
        )


def _guess_content_type(file_name: str, content: bytes | None = None) -> str:
    lower_name = file_name.lower()
    if lower_name.endswith(".png"):
        return "image/png"
    if lower_name.endswith(".jpg") or lower_name.endswith(".jpeg"):
        return "image/jpeg"
    if lower_name.endswith(".webp"):
        return "image/webp"
    if lower_name.endswith(".bmp"):
        return "image/bmp"

    if content:
        try:
            with Image.open(BytesIO(content)) as image:
                format_name = (image.format or "").upper()
                if format_name == "PNG":
                    return "image/png"
                if format_name == "JPEG":
                    return "image/jpeg"
                if format_name == "WEBP":
                    return "image/webp"
                if format_name == "BMP":
                    return "image/bmp"
        except UnidentifiedImageError:
            pass
        except Exception:
            pass

    # Supabase storage bucket often restricts to image/* MIME types.
    return "image/png"
