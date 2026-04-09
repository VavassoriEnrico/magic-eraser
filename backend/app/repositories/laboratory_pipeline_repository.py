from sqlalchemy.orm import Session

from app.models import LaboratoryPipeline, LaboratoryPipelineStep


def create_pipeline(
    db: Session,
    *,
    project_id: int,
    source_image_id: int,
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


def get_pipeline_by_id(db: Session, pipeline_id: int) -> LaboratoryPipeline | None:
    return db.query(LaboratoryPipeline).filter(LaboratoryPipeline.id == pipeline_id).first()


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


def create_step(
    db: Session,
    *,
    pipeline_id: int,
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


def list_steps_by_pipeline(db: Session, pipeline_id: int) -> list[LaboratoryPipelineStep]:
    return (
        db.query(LaboratoryPipelineStep)
        .filter(LaboratoryPipelineStep.pipeline_id == pipeline_id)
        .order_by(LaboratoryPipelineStep.step_index.asc(), LaboratoryPipelineStep.id.asc())
        .all()
    )
