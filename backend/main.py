from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models
import schemas
from database import engine, SessionLocal

# crea tabelle automaticamente
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS per React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "go to ...../docs for the SWAGGER"}




@app.post("/projects", response_model=schemas.Project)
def create_project(project: schemas.ProjectCreate, db : Session = Depends(get_db)):
    db_project = models.Project(name = project.name)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project




@app.get("/projects", response_model=list[schemas.Project])
def read_projects(db: Session = Depends(get_db)):
    return db.query(models.Project).all()




@app.get("/projects/{project_id}", response_model=schemas.Project)
def get_project_by_id(project_id: int, db:Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if project is None:
        raise HTTPException(status_code=404, detail="project not found")
    return project


@app.delete("/projects/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if project is None:
        raise HTTPException(status_code=404, detail="project not found")
    db.delete(project)
    db.commit()
    return {"message": "Project deleted"}



@app.post("/projects/{project_id}/images", response_model=schemas.Image)
def add_image(project_id: int, image: schemas.ImageCreate, db : Session = Depends(get_db)):
    
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db_image = models.Image(
        project_id = project_id,
        fileName = image.fileName,
        filePath = image.filePath
    )
    
    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    return db_image


@app.get("/projects/{project_id}/images", response_model=list[schemas.Image])
def read_project_images(project_id: int, db: Session = Depends(get_db)):
    return db.query(models.Image).filter(models.Image.project_id == project_id).all()



@app.delete("/images/{image_id}")
def delete_image(image_id: int, db: Session = Depends(get_db)):
    image = db.query(models.Image).filter(models.Image.id == image_id).first()
    if image is None:
        raise HTTPException(status_code=404, detail="image not found")
    db.delete(image)
    db.commit()
    return {"message": "Image deleted"}





