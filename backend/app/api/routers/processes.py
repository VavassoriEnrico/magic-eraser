from fastapi import APIRouter

from app.catalogs.segment_models import SEGMENT_MODEL_REGISTRY
from app.schemas.process import ProcessRunRequest, ProcessRunResponse
from app.services import process_service

#API endpoints for the process entity

router = APIRouter(prefix="/processes", tags=["processes"])


@router.get("/segment-models")
def list_segment_models():
    models = []
    for key, info in SEGMENT_MODEL_REGISTRY.items():
        models.append(
            {
                "key": key,
                "label": info.get("label", key),
                "default": bool(info.get("default", False)),
            }
        )

    models.sort(key=lambda model: (not model["default"], model["label"]))
    return models

#Run a process
@router.post("/run", response_model=ProcessRunResponse)
def run_process(payload: ProcessRunRequest):
    return process_service.run_process(payload)
