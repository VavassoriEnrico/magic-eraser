from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
from dependencies import get_db

router = APIRouter(prefix="/images", tags=["images"])


@router.delete("/{image_id}")
def delete_image(image_id: int, db: Session = Depends(get_db)):
    image = db.query(models.Image).filter(models.Image.id == image_id).first()
    if image is None:
        raise HTTPException(status_code=404, detail="image not found")
    db.delete(image)
    db.commit()
    return {"message": "Image deleted"}
