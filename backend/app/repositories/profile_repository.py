from sqlalchemy.orm import Session

from app.models import Profile


def get_by_id(db: Session, profile_id: str) -> Profile | None:
    return db.query(Profile).filter(Profile.id == profile_id).first()


def create(
    db: Session,
    *,
    profile_id: str,
    email: str | None = None,
    name: str | None = None,
    surname: str | None = None,
    username: str | None = None,
) -> Profile:
    profile = Profile(
        id=profile_id,
        email=email,
        name=name,
        surname=surname,
        username=username,
    )
    db.add(profile)
    return profile


def update_fields(
    db: Session,
    profile: Profile,
    *,
    name: str | None = None,
    surname: str | None = None,
    username: str | None = None,
) -> Profile:
    profile.name = name
    profile.surname = surname
    profile.username = username
    db.add(profile)
    return profile
