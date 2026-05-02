from sqlalchemy import inspect, text
from sqlalchemy.exc import NoSuchTableError

from app.db.session import Base, engine
from app.models import image, laboratory_pipeline, laboratory_pipeline_step, profile, project  # noqa: F401


# databse initialization
def init_db() -> None:
    with engine.begin() as connection:
        connection.execute(text("CREATE EXTENSION IF NOT EXISTS pgcrypto"))
    Base.metadata.create_all(bind=engine)
    ensure_projects_columns()
    ensure_laboratory_pipelines_columns()

def ensure_projects_columns() -> None:
    inspector = inspect(engine)
    try:
        columns = {column["name"] for column in inspector.get_columns("projects")}
    except NoSuchTableError:
        return

    with engine.begin() as connection:
        if "updated_at" not in columns:
            connection.execute(text("ALTER TABLE projects ADD COLUMN updated_at TIMESTAMP"))
            connection.execute(
                text("UPDATE projects SET updated_at = created_at WHERE updated_at IS NULL")
            )

        if "user_id" not in columns:
            connection.execute(text("ALTER TABLE projects ADD COLUMN user_id UUID"))


def ensure_laboratory_pipelines_columns() -> None:
    inspector = inspect(engine)
    try:
        columns = {column["name"] for column in inspector.get_columns("laboratory_pipelines")}
    except NoSuchTableError:
        return

    with engine.begin() as connection:
        if "user_id" not in columns:
            connection.execute(text("ALTER TABLE laboratory_pipelines ADD COLUMN user_id UUID"))
