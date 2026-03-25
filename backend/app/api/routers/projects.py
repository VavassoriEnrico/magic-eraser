from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.schemas import ImageFromUrlCreate, ImageRead, ProjectCreate, ProjectRead, ProjectUpdate
from app.services import project_service

router = APIRouter(prefix="/projects", tags=["projects"])

#create a new project
@router.post("", response_model=ProjectRead)
def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    return project_service.create_project(db, project.name)

#get all projects in the db
@router.get("", response_model=list[ProjectRead])
def read_projects(db: Session = Depends(get_db)):
    return project_service.list_projects(db)

#get project by id
@router.get("/{project_id}", response_model=ProjectRead)
def get_project_by_id(project_id: int, db: Session = Depends(get_db)):
    return project_service.get_project(db, project_id)

#delete project using its id
@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    project_service.delete_project(db, project_id)
    return {"message": "Project deleted"}

#update project name using its id, payload is the new name passed as str in project.py
@router.patch("/{project_id}", response_model=ProjectRead)
def update_project(project_id: int, payload: ProjectUpdate, db: Session = Depends(get_db)):
    return project_service.update_project_name(db, project_id, payload.name)

#upload image to project using project_id and file as payload (UploadFile), the difference 
@router.post("/{project_id}/images/upload", response_model=ImageRead)
def upload_image(
    project_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    return project_service.upload_image(db, project_id, file)


@router.post("/{project_id}/images/from-url", response_model=ImageRead)
def upload_image_from_url(
    project_id: int,
    payload: ImageFromUrlCreate,
    db: Session = Depends(get_db),
):
    return project_service.upload_image_from_url(
        db,
        project_id=project_id,
        image_url=payload.image_url,
        file_name=payload.file_name,
    )

#list all images of a project using its id
@router.get("/{project_id}/images", response_model=list[ImageRead])
def read_project_images(project_id: int, db: Session = Depends(get_db)):
    return project_service.list_project_images(db, project_id)
