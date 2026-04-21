from sqlalchemy.orm import Session

from app.models import Profile
from app.repositories import profile_repository


def _normalize_text(value: str | None) -> str | None:
    if value is None:
        return None
    clean = value.strip()
    return clean or None


def get_or_create_profile(
    db: Session,
    *,
    user_id: str,
    email: str | None = None,
) -> Profile:
    profile = profile_repository.get_by_id(db, user_id)
    if profile is not None:
        return profile

    profile = profile_repository.create(
        db,
        profile_id=user_id,
        email=_normalize_text(email),
    )
    db.commit()
    db.refresh(profile)
    return profile


def update_profile(
    db: Session,
    *,
    user_id: str,
    email: str | None = None,
    name: str | None = None,
    surname: str | None = None,
    username: str | None = None,
) -> Profile:
    profile = get_or_create_profile(db, user_id=user_id, email=email)
    profile_repository.update_fields(
        db,
        profile,
        name=_normalize_text(name),
        surname=_normalize_text(surname),
        username=_normalize_text(username),
    )
    db.commit()
    db.refresh(profile)
    return profile
