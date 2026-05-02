import pytest
from fastapi import HTTPException

from app.api.routers import projects
from app.models import Image
from app.schemas import ImageFromUrlCreate, ProjectCreate, ProjectUpdate


def test_projects_router_crud_flow(db_session, test_user_id):
    created = projects.create_project(ProjectCreate(name="  Vision Board  "), db_session, test_user_id)
    project_id = created["id"]
    assert created["name"] == "Vision Board"

    listed = projects.read_projects(db_session, test_user_id)
    assert [project["id"] for project in listed] == [project_id]

    updated = projects.update_project(project_id, ProjectUpdate(name="Retouched"), db_session)
    assert updated["name"] == "Retouched"

    detail = projects.get_project_by_id(project_id, db_session)
    assert detail["id"] == project_id

    deleted = projects.delete_project(project_id, db_session)
    assert deleted == {"message": "Project deleted"}


def test_get_project_by_id_rejects_invalid_identifier(db_session):
    with pytest.raises(HTTPException) as exc_info:
        projects.get_project_by_id("not-a-number", db_session)

    assert exc_info.value.status_code == 422
    assert exc_info.value.detail == "invalid project id"


def test_upload_image_from_url_route_persists_image(db_session, test_user_id, monkeypatch):
    created = projects.create_project(ProjectCreate(name="Image Intake"), db_session, test_user_id)
    project_id = created["id"]

    monkeypatch.setattr(
        "app.services.project_service.fetch_remote_image",
        lambda _url: (b"image-bytes", "input.png"),
    )
    monkeypatch.setattr(
        "app.services.project_service.storage_service.save_project_bytes",
        lambda project_id, content, original_name: f"/uploads/{project_id}/{original_name}",
    )

    image = projects.upload_image_from_url(
        project_id,
        ImageFromUrlCreate(
            image_url="https://example.com/input.png",
            file_name="custom-name.png",
        ),
        db_session,
    )

    assert image["project_id"] == project_id
    assert image["fileName"] == "custom-name.png"
    assert image["filePath"] == f"/uploads/{project_id}/custom-name.png"


def test_read_project_images_returns_uploaded_images(db_session, test_user_id):
    created = projects.create_project(ProjectCreate(name="Catalog"), db_session, test_user_id)
    project_id = int(created["id"])

    image = Image(project_id=project_id, fileName="sample.png", filePath="/uploads/sample.png")
    db_session.add(image)
    db_session.commit()

    images = projects.read_project_images(str(project_id), db_session)

    assert images[0]["fileName"] == "sample.png"
