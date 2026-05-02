from io import BytesIO
from uuid import UUID

import pytest
from fastapi import HTTPException, UploadFile

from app.models import Image
from app.repositories import laboratory_pipeline_repository, project_repository
from app.services import project_service


def _create_project(db_session, test_user_id, name="Demo Project"):
    created = project_service.create_project(db_session, name, test_user_id)
    return project_repository.get_by_id(db_session, created["id"])


def _create_image(db_session, project, file_name="seed.png", file_path="/uploads/seed.png"):
    image = Image(project_id=project.id, fileName=file_name, filePath=file_path)
    db_session.add(image)
    db_session.commit()
    db_session.refresh(image)
    return image


def test_parse_project_identifier_returns_integer():
    assert project_service.parse_project_identifier(" 42 ") == 42


@pytest.mark.parametrize(
    ("raw_project_id", "expected_detail"),
    [
        ("", "project id is required"),
        ("abc", "invalid project id"),
    ],
)
def test_parse_project_identifier_rejects_invalid_values(raw_project_id, expected_detail):
    with pytest.raises(HTTPException) as exc_info:
        project_service.parse_project_identifier(raw_project_id)

    assert exc_info.value.status_code == 422
    assert exc_info.value.detail == expected_detail


def test_create_project_trims_name_and_persists_user(db_session, test_user_id):
    created = project_service.create_project(db_session, "  New Project  ", test_user_id)

    assert created["name"] == "New Project"
    assert created["id"] is not None

    persisted = project_repository.get_by_id(db_session, created["id"])
    assert persisted is not None
    assert persisted.user_id == UUID(test_user_id)


def test_create_project_rejects_blank_name(db_session, test_user_id):
    with pytest.raises(HTTPException) as exc_info:
        project_service.create_project(db_session, "   ", test_user_id)

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "project name cannot be empty"


def test_upload_image_from_url_persists_image(monkeypatch, db_session, test_user_id):
    project = _create_project(db_session, test_user_id)
    original_updated_at = project.updated_at

    monkeypatch.setattr(
        project_service,
        "fetch_remote_image",
        lambda url: (b"fake-image-content", "remote-image.png"),
    )
    monkeypatch.setattr(
        project_service.storage_service,
        "save_project_bytes",
        lambda project_id, content, original_name: f"/uploads/{project_id}/{original_name}",
    )

    image = project_service.upload_image_from_url(
        db_session,
        project_id=project.id,
        image_url="https://example.com/image.png",
    )

    db_session.refresh(project)
    assert image.fileName == "remote-image.png"
    assert image.filePath == f"/uploads/{project.id}/remote-image.png"
    assert project.updated_at >= original_updated_at


def test_upload_image_rolls_back_and_deletes_saved_file_on_repository_failure(
    monkeypatch, db_session, test_user_id
):
    project = _create_project(db_session, test_user_id)
    upload = UploadFile(filename="photo.png", file=BytesIO(b"content"))
    deleted_paths = []

    monkeypatch.setattr(
        project_service.storage_service,
        "save_project_upload",
        lambda project_id, file: ("photo.png", "/uploads/project_1/photo.png"),
    )
    monkeypatch.setattr(
        project_service.image_repository,
        "create",
        lambda *args, **kwargs: (_ for _ in ()).throw(RuntimeError("db write failed")),
    )
    monkeypatch.setattr(
        project_service.storage_service,
        "delete_public_upload",
        deleted_paths.append,
    )

    with pytest.raises(RuntimeError, match="db write failed"):
        project_service.upload_image(db_session, project.id, upload)

    assert deleted_paths == ["/uploads/project_1/photo.png"]


def test_delete_project_removes_related_pipelines(db_session, test_user_id):
    project = _create_project(db_session, test_user_id)
    image = _create_image(db_session, project)
    pipeline = laboratory_pipeline_repository.create_pipeline(
        db_session,
        project_id=project.id,
        source_image_id=image.id,
        user_id=UUID(test_user_id),
        start_image_url="https://example.com/start.png",
        name="Pipeline",
    )

    project_service.delete_project(db_session, project.id)

    assert project_repository.get_by_id(db_session, project.id) is None
    assert (
        laboratory_pipeline_repository.get_pipeline_by_id(
            db_session,
            pipeline.id,
            user_id=UUID(test_user_id),
        )
        is None
    )
