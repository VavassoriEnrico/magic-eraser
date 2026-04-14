from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.catalogs.process_catalog import PROCESS_CATALOG, get_segment_model_options, get_generation_model_options
from app.dependencies import get_db
from app.schemas.process import ProcessCatalogItem, ProcessModelOption, ProcessRunRequest, ProcessRunResponse
from app.services import process_service

#API endpoints for the process entity

router = APIRouter(prefix="/processes", tags=["processes"])


@router.get("/catalog", response_model=list[ProcessCatalogItem])
def get_process_catalog():
    return PROCESS_CATALOG


@router.get("/segment-models", response_model=list[ProcessModelOption])
def list_segment_models():
    return get_segment_model_options()

@router.get("/generation-models", response_model=list[ProcessModelOption])
def list_generation_models():
    return get_generation_model_options()


#Run a process
@router.post("/run", response_model=ProcessRunResponse)
def run_process(payload: ProcessRunRequest, db: Session = Depends(get_db)):
    return process_service.run_process(db, payload)
