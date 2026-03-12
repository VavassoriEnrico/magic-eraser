from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

import models
import schemas
from dependencies import get_db

router = APIRouter(prefix="/images", tags=["images"])


@router.delete("/{image_id}")
def delete_image(image_id: int, db: Session = Depends(get_db)):
    image = db.query(models.Image).filter(models.Image.id == image_id).first()
    if image is None:
        raise HTTPException(status_code=404, detail="image not found")
    project = db.query(models.Project).filter(models.Project.id == image.project_id).first()
    if project is not None:
        project.updated_at = datetime.now()
    db.delete(image)
    db.commit()
    return {"message": "Image deleted"}

#list images
@router.get("", response_model=list[schemas.Image])
def read_images(db: Session = Depends(get_db)):
    return db.query(models.Image).all()
