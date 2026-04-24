from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, Field


class AdditionalSettingChoice(BaseModel):
    value: str
    label: str


class AdditionalSettingDefinition(BaseModel):
    key: str
    label: str
    type: Literal["boolean", "select", "integer", "number", "text"]
    description: str | None = None
    depends_on_key: str | None = None
    depends_on_value: bool | int | float | str | None = None
    default_value: bool | int | float | str | None = None
    options: list[AdditionalSettingChoice] = Field(default_factory=list)
    min_value: int | float | None = None
    max_value: int | float | None = None
    step: int | float | None = None


class BaseProcessRequest(BaseModel):
    process_type: str
    project_id: UUID | None = None
    image_id: UUID | None = None
    pipeline_id: UUID | None = None
    step_index: int | None = None
    priority: int


class SegmentFromPromptRequest(BaseProcessRequest):
    process_type: Literal["segment_from_prompt"]
    priority: Literal[1]
    prompt: str
    input_image_url: str
    model_key: str | None = None
    additional_settings: dict[str, bool | int | float | str] = Field(default_factory=dict)


class GenerateFromPromptRequest(BaseProcessRequest):
    process_type: Literal["generate_from_prompt"]
    priority: Literal[3]
    prompt: str
    input_image_url: str
    mask_image_url: str
    model_key: str | None = None
    additional_settings: dict[str, bool | int | float | str] = Field(default_factory=dict)


class RemoveWithMaskRequest(BaseProcessRequest):
    process_type: Literal["remove_with_mask"]
    priority: Literal[2]
    input_image_url: str
    mask_image_url: str
    model_key: str | None = None
    additional_settings: dict[str, bool | int | float | str] = Field(default_factory=dict)


ProcessRunRequest = Annotated[
    SegmentFromPromptRequest | GenerateFromPromptRequest | RemoveWithMaskRequest,
    Field(discriminator="process_type"),
]


class ProcessRunResponse(BaseModel):
    process_type: str
    output_image_url: str


class ConvexHullMaskRequest(BaseModel):
    mask_image_url: str
    mode: Literal["simple", "medium", "rectangle"] = "medium"


class ConvexHullMaskResponse(BaseModel):
    output_image_url: str


class ProcessModelOption(BaseModel):
    key: str
    label: str
    default: bool = False
    additional_settings: list[AdditionalSettingDefinition] = Field(default_factory=list)


class ProcessCatalogItem(BaseModel):
    process_type: str
    title: str
    priority: int
    prompt_required: bool
    model_options: list[ProcessModelOption] = Field(default_factory=list)
