from sqlalchemy.orm import Session

from app.models import Image


def create(db: Session, project_id: int, file_name: str, file_path: str) -> Image:
    image = Image(project_id=project_id, fileName=file_name, filePath=file_path)
    db.add(image)
    db.flush()
    db.refresh(image)
    return image


def list_all(db: Session) -> list[Image]:
    return db.query(Image).all()


def list_by_project_id(db: Session, project_id: int) -> list[Image]:
    return db.query(Image).filter(Image.project_id == project_id).all()


def get_by_id(db: Session, image_id: int) -> Image | None:
    return db.query(Image).filter(Image.id == image_id).first()


def delete(db: Session, image: Image) -> None:
    db.delete(image)
    db.commit()
