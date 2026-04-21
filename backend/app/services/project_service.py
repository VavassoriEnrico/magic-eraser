from pathlib import Path

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.integrations.remote_image_fetcher import fetch_remote_image
from app.repositories import image_repository, project_repository
from app.services import storage_service


def create_project(db: Session, name: str):
    try:
        project = project_repository.create(db, name=name)
        db.commit()
        db.refresh(project)
        return project
    except Exception:
        db.rollback()
        raise


def list_projects(db: Session):
    return project_repository.list_all(db)


def get_project(db: Session, project_id: int):
    project = project_repository.get_by_id(db, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="project not found")
    return project


def delete_project(db: Session, project_id: int) -> None:
    project = get_project(db, project_id)
    try:
        project_repository.delete(db, project)
        db.commit()
    except Exception:
        db.rollback()
        raise


def update_project_name(db: Session, project_id: int, name: str):
    project = get_project(db, project_id)

    next_name = name.strip()
    if not next_name:
        raise HTTPException(status_code=400, detail="project name cannot be empty")

    try:
        project = project_repository.update_name(db, project, next_name)
        db.commit()
        db.refresh(project)
        return project
    except Exception:
        db.rollback()
        raise


def upload_image(db: Session, project_id: int, file: UploadFile):
    project = get_project(db, project_id)
    original_name, public_path = storage_service.save_project_upload(project_id, file)
    try:
        image = image_repository.create(
            db, project_id=project_id, file_name=original_name, file_path=public_path
        )
        project_repository.touch(db, project)
        db.commit()
        db.refresh(image)
        return image
    except Exception:
        db.rollback()
        storage_service.delete_public_upload(public_path)
        raise


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
    content, detected_name = fetch_remote_image(image_url)
    original_name = Path(file_name or detected_name).name or detected_name
    public_path = storage_service.save_project_bytes(project_id, content, original_name)
    try:
        image = image_repository.create(
            db, project_id=project_id, file_name=original_name, file_path=public_path
        )
        project_repository.touch(db, project)
        db.commit()
        db.refresh(image)
        return image
    except Exception:
        db.rollback()
        storage_service.delete_public_upload(public_path)
        raise
