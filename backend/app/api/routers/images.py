from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.schemas import ImageRead
from app.services import image_service

router = APIRouter(prefix="/images", tags=["images"])

#delete image using its id
@router.delete("/{image_id}")
def delete_image(image_id: int, db: Session = Depends(get_db)):
    image_service.delete_image(db, image_id)
    return {"message": "Image deleted"}

#get all images in the db
@router.get("", response_model=list[ImageRead])
def read_images(db: Session = Depends(get_db)):
    return image_service.list_images(db)
