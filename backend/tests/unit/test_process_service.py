from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from pydantic import TypeAdapter

from app.schemas.process import ProcessRunRequest
from app.services import process_service


def test_build_convex_hull_preview_requires_mask_url():
    with pytest.raises(HTTPException) as exc_info:
        process_service.build_convex_hull_preview("   ", "medium")

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "mask image url is required"


def test_build_convex_hull_preview_delegates_to_mask_builder(monkeypatch):
    monkeypatch.setattr(
        process_service,
        "build_convex_hull_mask",
        lambda mask_image_url, mode: f"{mask_image_url}?mode={mode}",
    )

    response = process_service.build_convex_hull_preview(
        "https://example.com/mask.png",
        "rectangle",
    )

    assert response.output_image_url == "https://example.com/mask.png?mode=rectangle"


def test_run_process_logs_successful_pipeline_step(monkeypatch, db_session):
    captured = {}
    payload = TypeAdapter(ProcessRunRequest).validate_python(
        {
            "process_type": "remove_with_mask",
            "priority": 2,
            "pipeline_id": "7",
            "step_index": 3,
            "input_image_url": "https://example.com/input.png",
            "mask_image_url": "https://example.com/mask.png",
            "model_key": "model-a",
            "additional_settings": {"strength": 2},
        }
    )

    monkeypatch.setattr(
        process_service.process_executor,
        "execute",
        lambda value: SimpleNamespace(
            process_type=value.process_type,
            output_image_url="https://example.com/output.png",
        ),
    )
    monkeypatch.setattr(
        process_service.laboratory_pipeline_service,
        "create_step",
        lambda db, **kwargs: captured.update(kwargs),
    )

    response = process_service.run_process(db_session, payload)

    assert response.process_type == "remove_with_mask"
    assert response.output_image_url == "https://example.com/output.png"
    assert captured["pipeline_id"] == 7
    assert captured["status"] == "done"
    assert captured["output_image_url"] == "https://example.com/output.png"
    assert captured["additional_settings_json"] == {"strength": 2}


def test_run_process_converts_value_error_to_http_400_and_logs_failure(monkeypatch, db_session):
    captured = {}
    payload = TypeAdapter(ProcessRunRequest).validate_python(
        {
            "process_type": "segment_from_prompt",
            "priority": 1,
            "pipeline_id": "4",
            "prompt": "subject",
            "input_image_url": "https://example.com/input.png",
            "additional_settings": {},
        }
    )

    monkeypatch.setattr(
        process_service.process_executor,
        "execute",
        lambda _value: (_ for _ in ()).throw(ValueError("invalid prompt")),
    )
    monkeypatch.setattr(
        process_service.laboratory_pipeline_service,
        "create_step",
        lambda db, **kwargs: captured.update(kwargs),
    )

    with pytest.raises(HTTPException) as exc_info:
        process_service.run_process(db_session, payload)

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "invalid prompt"
    assert captured["pipeline_id"] == 4
    assert captured["status"] == "failed"
    assert captured["error_message"] == "invalid prompt"
