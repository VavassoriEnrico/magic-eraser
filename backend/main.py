from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

import models
from database import engine
from routers import images, projects

# create tables automatically
models.Base.metadata.create_all(bind=engine)

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
