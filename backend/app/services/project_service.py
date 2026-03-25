import shutil
from urllib.parse import urlparse
from urllib.request import urlopen
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.repositories import image_repository, project_repository


def create_project(db: Session, name: str):
    return project_repository.create(db, name=name)


def list_projects(db: Session):
    return project_repository.list_all(db)


def get_project(db: Session, project_id: int):
    project = project_repository.get_by_id(db, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="project not found")
    return project


def delete_project(db: Session, project_id: int) -> None:
    project = get_project(db, project_id)
    project_repository.delete(db, project)


def update_project_name(db: Session, project_id: int, name: str):
    project = get_project(db, project_id)

    next_name = name.strip()
    if not next_name:
        raise HTTPException(status_code=400, detail="project name cannot be empty")

    return project_repository.update_name(db, project, next_name)


def upload_image(db: Session, project_id: int, file: UploadFile):
    project = get_project(db, project_id)

    safe_name = Path(file.filename or "upload.bin").name
    extension = Path(safe_name).suffix
    stored_name = f"{uuid4().hex}{extension}"

    project_upload_dir = settings.uploads_dir / f"project_{project_id}"
    project_upload_dir.mkdir(parents=True, exist_ok=True)

    stored_file = project_upload_dir / stored_name
    with stored_file.open("wb") as destination:
        shutil.copyfileobj(file.file, destination)

    public_path = f"/uploads/project_{project_id}/{stored_name}"
    image = image_repository.create(
        db, project_id=project_id, file_name=safe_name, file_path=public_path
    )
    project_repository.touch(db, project)
    db.commit()
    return image


def list_project_images(db: Session, project_id: int):
    get_project(db, project_id)
    return image_repository.list_by_project_id(db, project_id)


def upload_image_from_url(
    db: Session,
    project_id: int,
    image_url: str,
    file_name: str | None = None,
):
    project = get_project(db, project_id)

    source_url = image_url.strip()
    if not source_url:
        raise HTTPException(status_code=400, detail="image_url is required")

    try:
        with urlopen(source_url) as response:
            if response.status != 200:
                raise HTTPException(status_code=400, detail="cannot download image from provided url")
            content = response.read()
            content_type = response.headers.get("Content-Type", "")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="cannot download image from provided url")

    parsed_path = Path(urlparse(source_url).path)
    extension = parsed_path.suffix
    if not extension:
        if "png" in content_type:
            extension = ".png"
        elif "jpeg" in content_type or "jpg" in content_type:
            extension = ".jpg"
        elif "webp" in content_type:
            extension = ".webp"
        else:
            extension = ".bin"

    original_name = Path(file_name or parsed_path.name or f"image{extension}").name
    if Path(original_name).suffix == "":
        original_name = f"{original_name}{extension}"

    stored_name = f"{uuid4().hex}{Path(original_name).suffix}"

    project_upload_dir = settings.uploads_dir / f"project_{project_id}"
    project_upload_dir.mkdir(parents=True, exist_ok=True)

    stored_file = project_upload_dir / stored_name
    with stored_file.open("wb") as destination:
        destination.write(content)

    public_path = f"/uploads/project_{project_id}/{stored_name}"
    image = image_repository.create(
        db, project_id=project_id, file_name=original_name, file_path=public_path
    )
    project_repository.touch(db, project)
    db.commit()
    return image
