from pydantic import BaseModel


class ProcessExecutionResult(BaseModel):
    process_type: str
    output_image_url: str
