from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from dependencies import get_db

router = APIRouter(prefix="/projects", tags=["projects"])


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


@router.get("/{project_id}/images", response_model=list[schemas.Image])
def read_project_images(project_id: int, db: Session = Depends(get_db)):
    return db.query(models.Image).filter(models.Image.project_id == project_id).all()
