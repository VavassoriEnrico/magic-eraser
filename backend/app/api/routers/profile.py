from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db_dependencies import get_db
from app.dependencies.auth import get_current_user
from app.schemas import ProfileRead, ProfileUpdate
from app.services import profile_service

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/me", response_model=ProfileRead)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user_id = str(current_user.get("id") or current_user.get("sub") or "")
    user_email = current_user.get("email")
    return profile_service.get_or_create_profile(
        db,
        user_id=user_id,
        email=user_email if isinstance(user_email, str) else None,
    )


@router.patch("/me", response_model=ProfileRead)
def update_my_profile(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user_id = str(current_user.get("id") or current_user.get("sub") or "")
    user_email = current_user.get("email")
    return profile_service.update_profile(
        db,
        user_id=user_id,
        email=user_email if isinstance(user_email, str) else None,
        name=payload.name,
        surname=payload.surname,
        username=payload.username,
    )
