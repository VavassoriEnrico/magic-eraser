from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models
import schemas
from database import engine, SessionLocal

# crea tabelle automaticamente
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS per React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/items", response_model=schemas.Item)
def create_item(item: schemas.ItemCreate, db: Session = Depends(get_db)):
    db_item = models.Item(name=item.name)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.get("/items", response_model=list[schemas.Item])
def read_items(db: Session = Depends(get_db)):
    return db.query(models.Item).all()

@app.get("/")
def root():
    return {"message": "go to ...../docs for the SWAGGER"}