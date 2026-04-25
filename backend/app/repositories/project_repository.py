from datetime import datetime
from uuid import UUID

from sqlalchemy.orm import Session

from app.models import Project

#contains the repository for the project entity, 
#it is used to interact with the database and perform CRUD operations on the project table.

def create(db: Session, name: str, user_id: UUID) -> Project:
    project = Project(name=name, user_id=user_id)
    db.add(project)
    return project


def list_by_user_id(db: Session, user_id: UUID) -> list[Project]:
    return db.query(Project).filter(Project.user_id == user_id).all()


def get_by_id(db: Session, project_id: str) -> Project | None:
    return db.query(Project).filter(Project.id == project_id).first()


def update_name(db: Session, project: Project, name: str) -> Project:
    project.name = name
    project.updated_at = datetime.now()
    return project


def touch(db: Session, project: Project) -> None:
    project.updated_at = datetime.now()


def delete(db: Session, project: Project) -> None:
    db.delete(project)
