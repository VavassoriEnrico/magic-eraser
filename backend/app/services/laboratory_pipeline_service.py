from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import LaboratoryPipeline, LaboratoryPipelineStep
from app.repositories import laboratory_pipeline_repository

PipelineIdentifier = laboratory_pipeline_repository.PipelineIdentifier


def parse_pipeline_identifier(raw_pipeline_id: str) -> PipelineIdentifier:
    clean_value = raw_pipeline_id.strip()
    if not clean_value:
        raise HTTPException(status_code=422, detail="pipeline id is required")
    if not clean_value.isdigit():
        raise HTTPException(status_code=422, detail="invalid pipeline id")
    return int(clean_value)


def serialize_pipeline(pipeline: LaboratoryPipeline) -> dict[str, object]:
    return {
        "id": str(pipeline.id),
        "project_id": str(pipeline.project_id),
        "source_image_id": str(pipeline.source_image_id),
        "user_id": str(pipeline.user_id) if pipeline.user_id is not None else None,
        "name": pipeline.name,
        "start_image_url": pipeline.start_image_url,
        "final_image_url": pipeline.final_image_url,
        "status": pipeline.status,
        "created_at": pipeline.created_at,
        "updated_at": pipeline.updated_at,
    }


def serialize_pipeline_step(step: LaboratoryPipelineStep) -> dict[str, object]:
    return {
        "id": str(step.id),
        "pipeline_id": str(step.pipeline_id),
        "step_index": step.step_index,
        "process_type": step.process_type,
        "priority": step.priority,
        "model_key": step.model_key,
        "prompt": step.prompt,
        "additional_settings_json": step.additional_settings_json,
        "input_image_url": step.input_image_url,
        "mask_image_url": step.mask_image_url,
        "output_image_url": step.output_image_url,
        "status": step.status,
        "error_message": step.error_message,
        "created_at": step.created_at,
        "updated_at": step.updated_at,
    }


def create_pipeline(
    db: Session,
    *,
    project_id: int,
    source_image_id: int,
    user_id: str,
    start_image_url: str,
    name: str | None = None,
) -> LaboratoryPipeline:
    try:
        owner_id = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=401, detail="invalid token subject")
    try:
        return laboratory_pipeline_repository.create_pipeline(
            db,
            project_id=project_id,
            source_image_id=source_image_id,
            user_id=owner_id,
            start_image_url=start_image_url,
            name=name,
        )
    except Exception:
        db.rollback()
        raise


def get_pipeline(db: Session, pipeline_id: PipelineIdentifier, *, user_id: str) -> LaboratoryPipeline:
    try:
        owner_id = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=401, detail="invalid token subject")

    pipeline = laboratory_pipeline_repository.get_pipeline_by_id(db, pipeline_id, user_id=owner_id)
    if pipeline is None:
        raise HTTPException(status_code=404, detail="pipeline not found")
    return pipeline


def list_pipelines(db: Session, *, user_id: str) -> list[LaboratoryPipeline]:
    try:
        owner_id = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=401, detail="invalid token subject")
    return laboratory_pipeline_repository.list_pipelines(db, user_id=owner_id)


def update_pipeline_status(
    db: Session,
    *,
    pipeline_id: PipelineIdentifier,
    user_id: str,
    status: str,
    final_image_url: str | None = None,
) -> LaboratoryPipeline:
    pipeline = get_pipeline(db, pipeline_id, user_id=user_id)
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
    pipeline_id: PipelineIdentifier,
    user_id: str,
    name: str | None,
) -> LaboratoryPipeline:
    pipeline = get_pipeline(db, pipeline_id, user_id=user_id)
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


def replace_pipeline_snapshot(
    db: Session,
    *,
    pipeline_id: PipelineIdentifier,
    user_id: str,
    name: str | None,
    status: str,
    final_image_url: str | None,
    steps: list[dict[str, object]],
) -> LaboratoryPipeline:
    pipeline = get_pipeline(db, pipeline_id, user_id=user_id)
    clean_name = name.strip() if isinstance(name, str) else None
    clean_name = clean_name or None
    try:
        return laboratory_pipeline_repository.replace_pipeline_snapshot(
            db,
            pipeline=pipeline,
            name=clean_name,
            status=status,
            final_image_url=final_image_url,
            steps=steps,
        )
    except Exception:
        db.rollback()
        raise


def delete_pipeline(db: Session, pipeline_id: PipelineIdentifier, *, user_id: str) -> None:
    pipeline = get_pipeline(db, pipeline_id, user_id=user_id)
    try:
        laboratory_pipeline_repository.delete_pipeline(db, pipeline)
        db.commit()
    except Exception:
        db.rollback()
        raise


def create_step(
    db: Session,
    *,
    pipeline_id: PipelineIdentifier,
    user_id: str,
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
    get_pipeline(db, pipeline_id, user_id=user_id)
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


def list_steps(db: Session, pipeline_id: PipelineIdentifier, *, user_id: str) -> list[LaboratoryPipelineStep]:
    get_pipeline(db, pipeline_id, user_id=user_id)
    return laboratory_pipeline_repository.list_steps_by_pipeline(db, pipeline_id)
