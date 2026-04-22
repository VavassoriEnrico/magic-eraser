from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.catalogs.process_catalog import (
    get_generation_model_options,
    get_process_catalog as build_process_catalog,
    get_removal_model_options,
    get_segment_model_options,
)
from app.dependencies import get_db
from app.schemas.process import (
    ConvexHullMaskRequest,
    ConvexHullMaskResponse,
    ProcessCatalogItem,
    ProcessModelOption,
    ProcessRunRequest,
    ProcessRunResponse,
)
from app.services import process_service

#API endpoints for the process entity

router = APIRouter(prefix="/processes", tags=["processes"])


@router.get("/catalog", response_model=list[ProcessCatalogItem])
def get_process_catalog():
    return build_process_catalog()


@router.get("/segment-models", response_model=list[ProcessModelOption])
def list_segment_models():
    return get_segment_model_options()


@router.get("/remove-models", response_model=list[ProcessModelOption])
def list_remove_models():
    return get_removal_model_options()


@router.get("/generation-models", response_model=list[ProcessModelOption])
def list_generation_models():
    return get_generation_model_options()


#Run a process
@router.post("/run", response_model=ProcessRunResponse)
def run_process(payload: ProcessRunRequest, db: Session = Depends(get_db)):
    return process_service.run_process(db, payload)


@router.post("/convex-hull-preview", response_model=ConvexHullMaskResponse)
def build_convex_hull_preview(payload: ConvexHullMaskRequest):
    return process_service.build_convex_hull_preview(
        mask_image_url=payload.mask_image_url,
        mode=payload.mode,
    )
