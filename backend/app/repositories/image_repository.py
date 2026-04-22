from uuid import UUID

from sqlalchemy.orm import Session

from app.models import Image

#contains the repository for the image entity, 
#it is used to interact with the database and perform CRUD operations on the image table.

def create(db: Session, project_id: UUID, file_name: str, file_path: str) -> Image:
    image = Image(project_id=project_id, fileName=file_name, filePath=file_path)
    db.add(image)
    db.flush()
    return image


def list_all(db: Session) -> list[Image]:
    return db.query(Image).all()


def list_by_project_id(db: Session, project_id: UUID) -> list[Image]:
    return db.query(Image).filter(Image.project_id == project_id).all()


def get_by_id(db: Session, image_id: UUID) -> Image | None:
    return db.query(Image).filter(Image.id == image_id).first()


def delete(db: Session, image: Image) -> None:
    db.delete(image)
