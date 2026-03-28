from fastapi import HTTPException

from app.schemas.process import ProcessRunRequest, ProcessRunResponse
from app.services.generation_service import generate_from_prompt
from app.services.inpainting_service import remove_with_mask
from app.services.segmentation_service import segment_from_prompt

PROCESS_HANDLERS = {
    "segment_from_prompt": segment_from_prompt,
    "remove_with_mask": remove_with_mask,
    "generate_from_prompt": generate_from_prompt,
}


def run_process(payload: ProcessRunRequest) -> ProcessRunResponse:
    process_type = payload.process_type.strip()
    handler = PROCESS_HANDLERS.get(process_type)

    if handler is None:
        raise HTTPException(status_code=400, detail="unsupported process type")

    try:
        output_image_url = handler(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return ProcessRunResponse(
        process_type=process_type,
        output_image_url=output_image_url,
    )
