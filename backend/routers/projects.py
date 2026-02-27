from pathlib import Path
import shutil
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

import models
import schemas
from dependencies import get_db

router = APIRouter(prefix="/projects", tags=["projects"])
UPLOADS_DIR = Path(__file__).resolve().parent.parent / "uploads"


@router.post("", response_model=schemas.Project)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    db_project = models.Project(name=project.name)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


@router.get("", response_model=list[schemas.Project])
def read_projects(db: Session = Depends(get_db)):
    return db.query(models.Project).all()


@router.get("/{project_id}", response_model=schemas.Project)
def get_project_by_id(project_id: int, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if project is None:
        raise HTTPException(status_code=404, detail="project not found")
    return project


@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if project is None:
        raise HTTPException(status_code=404, detail="project not found")
    db.delete(project)
    db.commit()
    return {"message": "Project deleted"}


@router.post("/{project_id}/images", response_model=schemas.Image)
def add_image(project_id: int, image: schemas.ImageCreate, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    db_image = models.Image(
        project_id=project_id,
        fileName=image.fileName,
        filePath=image.filePath,
    )

    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    return db_image


#image upload
@router.post("/{project_id}/images/upload", response_model=schemas.Image)
def upload_image(
    project_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    safe_name = Path(file.filename or "upload.bin").name
    extension = Path(safe_name).suffix
    stored_name = f"{uuid4().hex}{extension}"
    project_upload_dir = UPLOADS_DIR / f"project_{project_id}"
    project_upload_dir.mkdir(parents=True, exist_ok=True)

    stored_file = project_upload_dir / stored_name
    with stored_file.open("wb") as destination:
        shutil.copyfileobj(file.file, destination)

    public_path = f"/uploads/project_{project_id}/{stored_name}"

    db_image = models.Image(
        project_id=project_id,
        fileName=safe_name,
        filePath=public_path,
    )
    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    return db_image


@router.get("/{project_id}/images", response_model=list[schemas.Image])
def read_project_images(project_id: int, db: Session = Depends(get_db)):
    return db.query(models.Image).filter(models.Image.project_id == project_id).all()
