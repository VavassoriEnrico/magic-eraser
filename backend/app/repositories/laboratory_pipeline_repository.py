from uuid import UUID

from sqlalchemy.orm import Session

from app.models import LaboratoryPipeline, LaboratoryPipelineStep


def create_pipeline(
    db: Session,
    *,
    project_id: UUID,
    source_image_id: UUID,
    start_image_url: str,
    name: str | None = None,
) -> LaboratoryPipeline:
    pipeline = LaboratoryPipeline(
        project_id=project_id,
        source_image_id=source_image_id,
        start_image_url=start_image_url,
        name=name,
        status="running",
    )
    db.add(pipeline)
    db.commit()
    db.refresh(pipeline)
    return pipeline


def get_pipeline_by_id(db: Session, pipeline_id: UUID) -> LaboratoryPipeline | None:
    return db.query(LaboratoryPipeline).filter(LaboratoryPipeline.id == pipeline_id).first()


def list_pipelines(db: Session) -> list[LaboratoryPipeline]:
    return db.query(LaboratoryPipeline).order_by(LaboratoryPipeline.updated_at.desc()).all()


def list_pipelines_by_project_id(db: Session, project_id: UUID) -> list[LaboratoryPipeline]:
    return (
        db.query(LaboratoryPipeline)
        .filter(LaboratoryPipeline.project_id == project_id)
        .order_by(LaboratoryPipeline.updated_at.desc())
        .all()
    )


def has_pipeline_for_source_image(db: Session, source_image_id: UUID) -> bool:
    return (
        db.query(LaboratoryPipeline.id)
        .filter(LaboratoryPipeline.source_image_id == source_image_id)
        .first()
        is not None
    )


def update_pipeline_status(
    db: Session,
    *,
    pipeline: LaboratoryPipeline,
    status: str,
    final_image_url: str | None = None,
) -> LaboratoryPipeline:
    pipeline.status = status
    if final_image_url is not None:
        pipeline.final_image_url = final_image_url

    db.add(pipeline)
    db.commit()
    db.refresh(pipeline)
    return pipeline


def update_pipeline_name(
    db: Session,
    *,
    pipeline: LaboratoryPipeline,
    name: str | None,
) -> LaboratoryPipeline:
    pipeline.name = name
    db.add(pipeline)
    db.commit()
    db.refresh(pipeline)
    return pipeline


def delete_pipeline(db: Session, pipeline: LaboratoryPipeline) -> None:
    db.delete(pipeline)


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
    step = LaboratoryPipelineStep(
        pipeline_id=pipeline_id,
        step_index=step_index,
        process_type=process_type,
        priority=priority,
        model_key=model_key,
        prompt=prompt,
        additional_settings_json=additional_settings_json,
        input_image_url=input_image_url,
        mask_image_url=mask_image_url,
        output_image_url=output_image_url,
        status=status,
        error_message=error_message,
    )
    db.add(step)
    db.commit()
    db.refresh(step)
    return step


def list_steps_by_pipeline(db: Session, pipeline_id: UUID) -> list[LaboratoryPipelineStep]:
    return (
        db.query(LaboratoryPipelineStep)
        .filter(LaboratoryPipelineStep.pipeline_id == pipeline_id)
        .order_by(LaboratoryPipelineStep.step_index.asc(), LaboratoryPipelineStep.id.asc())
        .all()
    )
