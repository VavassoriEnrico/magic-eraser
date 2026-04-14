from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.processes.executor import ProcessExecutor
from app.schemas.process import ProcessRunRequest, ProcessRunResponse
from app.services import laboratory_pipeline_service

process_executor = ProcessExecutor()


def _resolve_step_index(payload: ProcessRunRequest) -> int:
    return payload.step_index if payload.step_index is not None else 0


def _safe_text(value: object) -> str | None:
    if isinstance(value, str):
        clean = value.strip()
        if clean:
            return clean
    return None


def _log_step_success(
    db: Session,
    payload: ProcessRunRequest,
    output_image_url: str,
) -> None:
    if payload.pipeline_id is None:
        return

    laboratory_pipeline_service.create_step(
        db,
        pipeline_id=payload.pipeline_id,
        step_index=_resolve_step_index(payload),
        process_type=payload.process_type,
        priority=payload.priority,
        input_image_url=_safe_text(getattr(payload, "input_image_url", None)) or "",
        mask_image_url=_safe_text(getattr(payload, "mask_image_url", None)),
        prompt=_safe_text(getattr(payload, "prompt", None)),
        model_key=_safe_text(getattr(payload, "model_key", None)),
        additional_settings_json=getattr(payload, "additional_settings", None),
        output_image_url=output_image_url,
        status="done",
    )


def _log_step_failure(
    db: Session,
    payload: ProcessRunRequest,
    error_message: str,
) -> None:
    if payload.pipeline_id is None:
        return

    laboratory_pipeline_service.create_step(
        db,
        pipeline_id=payload.pipeline_id,
        step_index=_resolve_step_index(payload),
        process_type=payload.process_type,
        priority=payload.priority,
        input_image_url=_safe_text(getattr(payload, "input_image_url", None)) or "",
        mask_image_url=_safe_text(getattr(payload, "mask_image_url", None)),
        prompt=_safe_text(getattr(payload, "prompt", None)),
        model_key=_safe_text(getattr(payload, "model_key", None)),
        additional_settings_json=getattr(payload, "additional_settings", None),
        output_image_url=None,
        status="failed",
        error_message=error_message,
    )


def run_process(db: Session, payload: ProcessRunRequest) -> ProcessRunResponse:
    try:
        result = process_executor.execute(payload)
        _log_step_success(db, payload, result.output_image_url)
    except ValueError as exc:
        _log_step_failure(db, payload, str(exc))
        raise HTTPException(status_code=400, detail=str(exc))
    except HTTPException as exc:
        _log_step_failure(db, payload, str(exc.detail))
        raise
    except Exception as exc:
        _log_step_failure(db, payload, str(exc))
        raise

    return ProcessRunResponse(
        process_type=result.process_type,
        output_image_url=result.output_image_url,
    )
