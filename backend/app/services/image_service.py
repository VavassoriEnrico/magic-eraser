from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.repositories import (
    image_repository,
    laboratory_pipeline_repository,
    project_repository,
)
from app.services import storage_service

#list all images in the db
def list_images(db: Session):
    return image_repository.list_all(db)

#delete image using its id
def delete_image(db: Session, image_id: UUID) -> None:
    image = image_repository.get_by_id(db, image_id)
    if image is None:
        raise HTTPException(status_code=404, detail="image not found")

    if laboratory_pipeline_repository.has_pipeline_for_source_image(db, image.id):
        raise HTTPException(
            status_code=409,
            detail="cannot delete image: it is used as source image in a pipeline",
        )

    project = project_repository.get_by_id(db, image.project_id)
    image_path = image.filePath
    try:
        if project is not None:
            project_repository.touch(db, project)

        image_repository.delete(db, image)
        db.commit()
        storage_service.delete_public_upload(image_path)
    except Exception:
        db.rollback()
        raise
