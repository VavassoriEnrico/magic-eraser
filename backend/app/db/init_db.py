from sqlalchemy import inspect, text
from sqlalchemy.exc import NoSuchTableError

from app.db.session import Base, engine
from app.models import image, project  # noqa: F401


# databse initialization
def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    #ensure_projects_updated_at_column()

#makes sure that the project table has the updated_at column, if not it adds it
#useful to avoid conflicts with the old version of the app that didnt have it (it should be removed in the future)

#def ensure_projects_updated_at_column() -> None:
#    inspector = inspect(engine)
#    try:
#        columns = {column["name"] for column in inspector.get_columns("projects")}
#    except NoSuchTableError:
#        return
#
#    if "updated_at" in columns:
#        return
#    with engine.begin() as connection:
#        connection.execute(text("ALTER TABLE projects ADD COLUMN updated_at TIMESTAMP"))
#        connection.execute(
#            text("UPDATE projects SET updated_at = created_at WHERE updated_at IS NULL")
#        )



