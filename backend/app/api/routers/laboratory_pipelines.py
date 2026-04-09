from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.schemas.laboratory_pipeline import (
    PipelineFinishRequest,
    PipelineRead,
    PipelineRenameRequest,
    PipelineStartRequest,
    PipelineStartResponse,
    PipelineStepCreateRequest,
    PipelineStepRead,
)
from app.services import laboratory_pipeline_service

router = APIRouter(prefix="/laboratory-pipelines", tags=["laboratory-pipelines"])


@router.get("", response_model=list[PipelineRead])
def list_pipelines(db: Session = Depends(get_db)):
    return laboratory_pipeline_service.list_pipelines(db)


@router.get("/{pipeline_id}", response_model=PipelineRead)
def get_pipeline(pipeline_id: int, db: Session = Depends(get_db)):
    return laboratory_pipeline_service.get_pipeline(db, pipeline_id)


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


@router.patch("/{pipeline_id}/name", response_model=PipelineStartResponse)
def rename_pipeline(
    pipeline_id: int,
    payload: PipelineRenameRequest,
    db: Session = Depends(get_db),
):
    return laboratory_pipeline_service.update_pipeline_name(
        db,
        pipeline_id=pipeline_id,
        name=payload.name,
    )


@router.delete("/{pipeline_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pipeline(pipeline_id: int, db: Session = Depends(get_db)):
    laboratory_pipeline_service.delete_pipeline(db, pipeline_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{pipeline_id}/steps", response_model=list[PipelineStepRead])
def list_pipeline_steps(pipeline_id: int, db: Session = Depends(get_db)):
    return laboratory_pipeline_service.list_steps(db, pipeline_id)


@router.post("/{pipeline_id}/steps", response_model=PipelineStepRead)
def create_pipeline_step(
    pipeline_id: int,
    payload: PipelineStepCreateRequest,
    db: Session = Depends(get_db),
):
    return laboratory_pipeline_service.create_step(
        db,
        pipeline_id=pipeline_id,
        step_index=payload.step_index,
        process_type=payload.process_type,
        priority=payload.priority,
        input_image_url=payload.input_image_url,
        mask_image_url=payload.mask_image_url,
        prompt=payload.prompt,
        model_key=payload.model_key,
        additional_settings_json=payload.additional_settings_json,
        output_image_url=payload.output_image_url,
        status=payload.status,
        error_message=payload.error_message,
    )
