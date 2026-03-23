from fastapi import APIRouter

from app.schemas.process import ProcessRunRequest, ProcessRunResponse
from app.services import process_service

router = APIRouter(prefix="/processes", tags=["processes"])

#Run a process
@router.post("/run", response_model=ProcessRunResponse)
def run_process(payload: ProcessRunRequest):
    return process_service.run_process(payload)
