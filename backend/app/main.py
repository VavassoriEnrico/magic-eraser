from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import images, laboratory_pipelines, processes, profile, projects
from app.core.config import settings
from app.db.init_db import init_db

init_db()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router)
app.include_router(images.router)
app.include_router(processes.router)
app.include_router(laboratory_pipelines.router)
app.include_router(profile.router)


@app.get("/")
def root():
    return {"message": "go to ...../docs for the SWAGGER"}
