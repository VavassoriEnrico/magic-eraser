from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import LaboratoryPipeline, LaboratoryPipelineStep
from app.repositories import laboratory_pipeline_repository


def create_pipeline(
    db: Session,
    *,
    project_id: UUID,
    source_image_id: UUID,
    start_image_url: str,
    name: str | None = None,
) -> LaboratoryPipeline:
    try:
        return laboratory_pipeline_repository.create_pipeline(
            db,
            project_id=project_id,
            source_image_id=source_image_id,
            start_image_url=start_image_url,
            name=name,
        )
    except Exception:
        db.rollback()
        raise


def get_pipeline(db: Session, pipeline_id: UUID) -> LaboratoryPipeline:
    pipeline = laboratory_pipeline_repository.get_pipeline_by_id(db, pipeline_id)
    if pipeline is None:
        raise HTTPException(status_code=404, detail="pipeline not found")
    return pipeline


def list_pipelines(db: Session) -> list[LaboratoryPipeline]:
    return laboratory_pipeline_repository.list_pipelines(db)


def update_pipeline_status(
    db: Session,
    *,
    pipeline_id: UUID,
    status: str,
    final_image_url: str | None = None,
) -> LaboratoryPipeline:
    pipeline = get_pipeline(db, pipeline_id)
    try:
        return laboratory_pipeline_repository.update_pipeline_status(
            db,
            pipeline=pipeline,
            status=status,
            final_image_url=final_image_url,
        )
    except Exception:
        db.rollback()
        raise


def update_pipeline_name(
    db: Session,
    *,
    pipeline_id: UUID,
    name: str | None,
) -> LaboratoryPipeline:
    pipeline = get_pipeline(db, pipeline_id)
    clean_name = name.strip() if isinstance(name, str) else None
    clean_name = clean_name or None
    try:
        return laboratory_pipeline_repository.update_pipeline_name(
            db,
            pipeline=pipeline,
            name=clean_name,
        )
    except Exception:
        db.rollback()
        raise


def delete_pipeline(db: Session, pipeline_id: UUID) -> None:
    pipeline = get_pipeline(db, pipeline_id)
    try:
        laboratory_pipeline_repository.delete_pipeline(db, pipeline)
    except Exception:
        db.rollback()
        raise


def create_step(
    db: Session,
    *,
    pipeline_id: UUID,
    step_index: int,
    process_type: str,
    priority: int,
    input_image_url: str,
    mask_image_url: str | None = None,
    prompt: str | None = None,
    model_key: str | None = None,
    additional_settings_json: dict[str, object] | None = None,
    output_image_url: str | None = None,
    status: str = "done",
    error_message: str | None = None,
) -> LaboratoryPipelineStep:
    get_pipeline(db, pipeline_id)
    try:
        return laboratory_pipeline_repository.create_step(
            db,
            pipeline_id=pipeline_id,
            step_index=step_index,
            process_type=process_type,
            priority=priority,
            input_image_url=input_image_url,
            mask_image_url=mask_image_url,
            prompt=prompt,
            model_key=model_key,
            additional_settings_json=additional_settings_json,
            output_image_url=output_image_url,
            status=status,
            error_message=error_message,
        )
    except Exception:
        db.rollback()
        raise


def list_steps(db: Session, pipeline_id: UUID) -> list[LaboratoryPipelineStep]:
    get_pipeline(db, pipeline_id)
    return laboratory_pipeline_repository.list_steps_by_pipeline(db, pipeline_id)
