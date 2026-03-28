from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.repositories import image_repository, project_repository

#list all images in the db
def list_images(db: Session):
    return image_repository.list_all(db)

#delete image using its id
def delete_image(db: Session, image_id: int) -> None:
    image = image_repository.get_by_id(db, image_id)
    if image is None:
        raise HTTPException(status_code=404, detail="image not found")

    project = project_repository.get_by_id(db, image.project_id)
    try:
        if project is not None:
            project_repository.touch(db, project)

        image_repository.delete(db, image)
        db.commit()
    except Exception:
        db.rollback()
        raise
