from app.api.routers import laboratory_pipelines, projects
from app.models import Image
from app.schemas import ProjectCreate
from app.schemas.laboratory_pipeline import (
    PipelineFinishRequest,
    PipelineRenameRequest,
    PipelineStartRequest,
    PipelineStepCreateRequest,
)


def _create_project(db_session, test_user_id):
    response = projects.create_project(ProjectCreate(name="Pipeline Project"), db_session, test_user_id)
    return int(response["id"])


def _create_image(db_session, project_id):
    image = Image(project_id=project_id, fileName="source.png", filePath="/uploads/source.png")
    db_session.add(image)
    db_session.commit()
    db_session.refresh(image)
    return image


def test_laboratory_pipeline_router_end_to_end(db_session, test_user_id):
    project_id = _create_project(db_session, test_user_id)
    image = _create_image(db_session, project_id)

    started = laboratory_pipelines.start_pipeline(
        PipelineStartRequest(
            project_id=str(project_id),
            source_image_id=str(image.id),
            start_image_url="https://example.com/start.png",
            name=" First pass ",
        ),
        db_session,
        test_user_id,
    )
    pipeline_id = started["id"]
    assert started["status"] == "running"

    renamed = laboratory_pipelines.rename_pipeline(
        pipeline_id,
        PipelineRenameRequest(name="  Final pipeline  "),
        db_session,
        test_user_id,
    )
    assert renamed["name"] == "Final pipeline"

    step = laboratory_pipelines.create_pipeline_step(
        pipeline_id,
        PipelineStepCreateRequest(
            step_index=0,
            process_type="segment_from_prompt",
            priority=1,
            prompt="subject",
            input_image_url="https://example.com/start.png",
            status="done",
        ),
        db_session,
        test_user_id,
    )
    assert step["process_type"] == "segment_from_prompt"

    pipelines = laboratory_pipelines.list_pipelines(db_session, test_user_id)
    assert pipelines[0]["id"] == pipeline_id

    steps = laboratory_pipelines.list_pipeline_steps(pipeline_id, db_session, test_user_id)
    assert len(steps) == 1

    finished = laboratory_pipelines.finish_pipeline(
        pipeline_id,
        PipelineFinishRequest(
            status="done",
            final_image_url="https://example.com/final.png",
        ),
        db_session,
        test_user_id,
    )
    assert finished["status"] == "done"

    deleted = laboratory_pipelines.delete_pipeline(pipeline_id, db_session, test_user_id)
    assert deleted.status_code == 204
