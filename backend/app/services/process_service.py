from fastapi import HTTPException

from app.processes import PROCESS_REGISTRY
from app.schemas.process import ProcessRunRequest, ProcessRunResponse


def run_process(payload: ProcessRunRequest) -> ProcessRunResponse:
    process_type = payload.process_type.strip()
    process = PROCESS_REGISTRY.get(process_type)
    if process is None:
        raise HTTPException(status_code=400, detail="unsupported process type")

    output_image_url = process.run(payload)
    return ProcessRunResponse(
        process_type=process_type,
        output_image_url=output_image_url,
    )
