from pathlib import Path
from uuid import UUID

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.integrations.remote_image_fetcher import fetch_remote_image
from app.repositories import (
    image_repository,
    laboratory_pipeline_repository,
    project_repository,
)
from app.services import storage_service

ProjectIdentifier = str


def _read_value(entity: object, key: str) -> object:
    if isinstance(entity, dict):
        return entity.get(key)
    return getattr(entity, key)


def parse_project_identifier(raw_project_id: str) -> ProjectIdentifier:
    clean_value = raw_project_id.strip()
    if not clean_value:
        raise HTTPException(status_code=422, detail="project id is required")
    return clean_value


def serialize_project(project) -> dict[str, object]:
    return {
        "id": str(_read_value(project, "id")),
        "name": _read_value(project, "name"),
        "created_at": _read_value(project, "created_at"),
        "updated_at": _read_value(project, "updated_at"),
    }


def serialize_image(image) -> dict[str, object]:
    return {
        "id": str(_read_value(image, "id")),
        "project_id": str(_read_value(image, "project_id")),
        "fileName": _read_value(image, "fileName"),
        "filePath": _read_value(image, "filePath"),
        "created_at": _read_value(image, "created_at"),
    }


def create_project(db: Session, name: str, user_id: str):
    next_name = name.strip()
    if not next_name:
        raise HTTPException(status_code=400, detail="project name cannot be empty")
    try:
        owner_id = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=401, detail="invalid token subject")

    try:
        project = project_repository.create(db, name=next_name, user_id=owner_id)
        db.flush()
        created_project = {
            "id": project.id,
            "name": project.name,
            "created_at": project.created_at,
            "updated_at": project.updated_at,
        }
        db.commit()
        return created_project
    except Exception:
        db.rollback()
        raise


def list_projects(db: Session, user_id: str):
    try:
        owner_id = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=401, detail="invalid token subject")
    return project_repository.list_by_user_id(db, owner_id)


def get_project(db: Session, project_id: ProjectIdentifier):
    project = project_repository.get_by_id(db, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="project not found")
    return project


def delete_project(db: Session, project_id: ProjectIdentifier) -> None:
    project = get_project(db, project_id)
    try:
        pipelines = laboratory_pipeline_repository.list_pipelines_by_project_id(db, project_id)
        for pipeline in pipelines:
            laboratory_pipeline_repository.delete_pipeline(db, pipeline)
        project_repository.delete(db, project)
        db.commit()
    except Exception:
        db.rollback()
        raise


def update_project_name(db: Session, project_id: ProjectIdentifier, name: str):
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


def upload_image(db: Session, project_id: ProjectIdentifier, file: UploadFile):
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


def list_project_images(db: Session, project_id: ProjectIdentifier):
    get_project(db, project_id)
    return image_repository.list_by_project_id(db, project_id)


def upload_image_from_url(
    db: Session,
    project_id: ProjectIdentifier,
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
