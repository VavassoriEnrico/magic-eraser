from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.schemas.laboratory_pipeline import (
    PipelineFinishRequest,
    PipelineStartRequest,
    PipelineStartResponse,
    PipelineStepRead,
)
from app.services import laboratory_pipeline_service

router = APIRouter(prefix="/laboratory-pipelines", tags=["laboratory-pipelines"])


@router.post("/start", response_model=PipelineStartResponse)
def start_pipeline(payload: PipelineStartRequest, db: Session = Depends(get_db)):
    return laboratory_pipeline_service.create_pipeline(
        db,
        project_id=payload.project_id,
        source_image_id=payload.source_image_id,
        start_image_url=payload.start_image_url,
        name=payload.name,
    )


@router.post("/{pipeline_id}/finish", response_model=PipelineStartResponse)
def finish_pipeline(
    pipeline_id: int,
    payload: PipelineFinishRequest,
    db: Session = Depends(get_db),
):
    return laboratory_pipeline_service.update_pipeline_status(
        db,
        pipeline_id=pipeline_id,
        status=payload.status,
        final_image_url=payload.final_image_url,
    )


@router.get("/{pipeline_id}/steps", response_model=list[PipelineStepRead])
def list_pipeline_steps(pipeline_id: int, db: Session = Depends(get_db)):
    return laboratory_pipeline_service.list_steps(db, pipeline_id)
