from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ImageCreate(BaseModel):
    fileName: str
    filePath: str


class ImageRead(BaseModel):
    id: int
    project_id: int
    fileName: str
    filePath: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
