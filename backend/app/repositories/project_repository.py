from datetime import datetime

from sqlalchemy.orm import Session

from app.models import Project

#contains the repository for the project entity, 
#it is used to interact with the database and perform CRUD operations on the project table.

def create(db: Session, name: str) -> Project:
    project = Project(name=name)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def list_all(db: Session) -> list[Project]:
    return db.query(Project).all()


def get_by_id(db: Session, project_id: int) -> Project | None:
    return db.query(Project).filter(Project.id == project_id).first()


def update_name(db: Session, project: Project, name: str) -> Project:
    project.name = name
    project.updated_at = datetime.now()
    db.commit()
    db.refresh(project)
    return project


def touch(db: Session, project: Project) -> None:
    project.updated_at = datetime.now()


def delete(db: Session, project: Project) -> None:
    db.delete(project)
    db.commit()
