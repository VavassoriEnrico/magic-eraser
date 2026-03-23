from abc import ABC, abstractmethod

from fastapi import HTTPException

from app.schemas.process import ProcessRunRequest


class BaseProcess(ABC):
    process_type: str
    prompt_required: bool

    def validate(self, payload: ProcessRunRequest) -> None:
        prompt = payload.prompt.strip()
        input_image_url = payload.input_image_url.strip()

        if not prompt:
            raise HTTPException(status_code=400, detail="prompt is required")
        if not input_image_url:
            raise HTTPException(status_code=400, detail="input image url is required")

    @abstractmethod
    def run(self, payload: ProcessRunRequest) -> str:
        pass
