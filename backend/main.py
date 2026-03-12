from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from sqlalchemy import inspect, text

import models
from database import engine
from routers import images, projects

# create tables automatically
models.Base.metadata.create_all(bind=engine)


def ensure_projects_updated_at_column() -> None:
    inspector = inspect(engine)
    columns = {column["name"] for column in inspector.get_columns("projects")}
    if "updated_at" in columns:
        return

    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE projects ADD COLUMN updated_at TIMESTAMP"))
        connection.execute(text("UPDATE projects SET updated_at = created_at WHERE updated_at IS NULL"))


ensure_projects_updated_at_column()

app = FastAPI()

# CORS for React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router)
app.include_router(images.router)

UPLOADS_DIR = Path(__file__).resolve().parent / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")


@app.get("/")
def root():
    return {"message": "go to ...../docs for the SWAGGER"}
