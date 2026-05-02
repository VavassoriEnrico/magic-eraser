from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PipelineStartRequest(BaseModel):
    project_id: str
    source_image_id: str
    start_image_url: str
    name: str | None = None


class PipelineStartResponse(BaseModel):
    id: str
    project_id: str
    source_image_id: str
    start_image_url: str
    final_image_url: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PipelineRead(BaseModel):
    id: str
    project_id: str
    source_image_id: str
    name: str | None = None
    start_image_url: str
    final_image_url: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PipelineFinishRequest(BaseModel):
    status: str
    final_image_url: str | None = None


class PipelineRenameRequest(BaseModel):
    name: str | None = None


class PipelineSnapshotStep(BaseModel):
    step_index: int
    process_type: str
    priority: int
    model_key: str | None = None
    prompt: str | None = None
    additional_settings_json: dict[str, object] | None = None
    input_image_url: str
    mask_image_url: str | None = None
    output_image_url: str | None = None
    status: str = "done"
    error_message: str | None = None


class PipelineReplaceRequest(BaseModel):
    name: str | None = None
    status: str
    final_image_url: str | None = None
    steps: list[PipelineSnapshotStep] = Field(default_factory=list)


class PipelineStepRead(BaseModel):
    id: str
    pipeline_id: str
    step_index: int
    process_type: str
    priority: int
    model_key: str | None = None
    prompt: str | None = None
    additional_settings_json: dict[str, object] | None = None
    input_image_url: str
    mask_image_url: str | None = None
    output_image_url: str | None = None
    status: str
    error_message: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PipelineStepCreateRequest(BaseModel):
    step_index: int
    process_type: str
    priority: int
    model_key: str | None = None
    prompt: str | None = None
    additional_settings_json: dict[str, object] | None = None
    input_image_url: str
    mask_image_url: str | None = None
    output_image_url: str | None = None
    status: str = "done"
    error_message: str | None = None
