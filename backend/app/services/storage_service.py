from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from app.core.config import settings


def save_project_upload(project_id: int, file: UploadFile) -> tuple[str, str]:
    original_name = Path(file.filename or "upload.bin").name
    extension = Path(original_name).suffix
    stored_name = f"{uuid4().hex}{extension}"
    project_upload_dir = _get_project_upload_dir(project_id)
    stored_file = project_upload_dir / stored_name

    with stored_file.open("wb") as destination:
        while chunk := file.file.read(1024 * 1024):
            destination.write(chunk)

    return original_name, _build_public_path(project_id, stored_name)


def save_project_bytes(
    project_id: int,
    content: bytes,
    original_name: str,
) -> str:
    safe_name = Path(original_name).name or "upload.bin"
    extension = Path(safe_name).suffix
    stored_name = f"{uuid4().hex}{extension}"
    project_upload_dir = _get_project_upload_dir(project_id)
    stored_file = project_upload_dir / stored_name
    stored_file.write_bytes(content)
    return _build_public_path(project_id, stored_name)


def delete_public_upload(public_path: str) -> None:
    path = public_path.strip()
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


def _get_project_upload_dir(project_id: int) -> Path:
    project_upload_dir = settings.uploads_dir / f"project_{project_id}"
    project_upload_dir.mkdir(parents=True, exist_ok=True)
    return project_upload_dir


def _build_public_path(project_id: int, stored_name: str) -> str:
    return f"/uploads/project_{project_id}/{stored_name}"
