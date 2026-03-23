from pydantic import BaseModel


class ProcessRunRequest(BaseModel):
    process_type: str
    prompt: str
    input_image_url: str
    project_id: int | None = None
    image_id: int | None = None


class ProcessRunResponse(BaseModel):
    process_type: str
    output_image_url: str
