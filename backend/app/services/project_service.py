import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.repositories import image_repository, project_repository
from app.schemas import ImageCreate


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


def add_image(db: Session, project_id: int, payload: ImageCreate):
    project = get_project(db, project_id)
    image = image_repository.create(
        db, project_id=project_id, file_name=payload.fileName, file_path=payload.filePath
    )
    project_repository.touch(db, project)
    db.commit()
    return image


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
