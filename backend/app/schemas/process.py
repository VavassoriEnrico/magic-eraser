from typing import Annotated, Literal

from pydantic import BaseModel, Field


class BaseProcessRequest(BaseModel):
    process_type: str
    project_id: int | None = None
    image_id: int | None = None


class SegmentFromPromptRequest(BaseProcessRequest):
    process_type: Literal["segment_from_prompt"]
    prompt: str
    input_image_url: str
    model_key: str | None = None


class GenerateFromPromptRequest(BaseProcessRequest):
    process_type: Literal["generate_from_prompt"]
    prompt: str
    model_key: str | None = None


class RemoveWithMaskRequest(BaseProcessRequest):
    process_type: Literal["remove_with_mask"]
    input_image_url: str
    mask_image_url: str


ProcessRunRequest = Annotated[
    SegmentFromPromptRequest | GenerateFromPromptRequest | RemoveWithMaskRequest,
    Field(discriminator="process_type"),
]


class ProcessRunResponse(BaseModel):
    process_type: str
    output_image_url: str
