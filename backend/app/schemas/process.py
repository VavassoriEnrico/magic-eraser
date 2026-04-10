from typing import Annotated, Literal

from pydantic import BaseModel, Field


class AdditionalSettingChoice(BaseModel):
    value: str
    label: str


class AdditionalSettingDefinition(BaseModel):
    key: str
    label: str
    type: Literal["boolean", "select", "integer"]
    description: str | None = None
    depends_on_key: str | None = None
    depends_on_value: bool | int | float | str | None = None
    default_value: bool | int | float | str | None = None
    options: list[AdditionalSettingChoice] = []
    min_value: int | None = None
    max_value: int | None = None
    step: int | None = None


class BaseProcessRequest(BaseModel):
    process_type: str
    project_id: int | None = None
    image_id: int | None = None
    pipeline_id: int | None = None
    step_index: int | None = None
    priority: int
    explanation: str | None = None
    priority_explanation: str | None = None


class SegmentFromPromptRequest(BaseProcessRequest):
    process_type: Literal["segment_from_prompt"]
    explanation: Literal[
        "Segmentation is a process that extract a mask from a prompt, so you can select just what you want"
    ] = "Segmentation is a process that extract a mask from a prompt, so you can select just what you want"
    priority_explanation: Literal[
        "Segmentation process can be executed one or more times, but only at the beginning of the workflow"
    ] = "Segmentation process can be executed one or more times, but only at the beginning of the workflow"
    priority: Literal[1]
    prompt: str
    input_image_url: str
    model_key: str | None = None
    additional_settings: dict[str, bool | int | float | str] = Field(default_factory=dict)


class GenerateFromPromptRequest(BaseProcessRequest):
    process_type: Literal["generate_from_prompt"]
    explanation: Literal["Generation is a process that generate a part of an image from a prompt"] = (
        "Generation is a process that generate a part of an image from a prompt"
    )
    priority_explanation: Literal[
        "Generation process can be executed one or more times, but only at the end of the workflow"
    ] = "Generation process can be executed one or more times, but only at the end of the workflow"
    priority: Literal[3]
    prompt: str | None = None
    input_image_url: str
    model_key: str | None = None


class RemoveWithMaskRequest(BaseProcessRequest):
    process_type: Literal["remove_with_mask"]
    explanation: Literal[
        "Removal is a process that remove a part of an image from the mask that come from segmentation"
    ] = "Removal is a process that remove a part of an image from the mask that come from segmentation"
    priority_explanation: Literal[
        "Removal process can be executed only after the segmentation and before the generation"
    ] = "Removal process can be executed only after the segmentation and before the generation"
    priority: Literal[2]
    input_image_url: str
    mask_image_url: str


ProcessRunRequest = Annotated[
    SegmentFromPromptRequest | GenerateFromPromptRequest | RemoveWithMaskRequest,
    Field(discriminator="process_type"),
]


class ProcessRunResponse(BaseModel):
    process_type: str
    output_image_url: str


class ProcessModelOption(BaseModel):
    key: str
    label: str
    default: bool = False
    additional_settings: list[AdditionalSettingDefinition] = []


class ProcessCatalogItem(BaseModel):
    process_type: str
    title: str
    priority: int
    prompt_required: bool
    explanation: str | None = None
    priority_explanation: str | None = None
    model_options: list[ProcessModelOption] = []
