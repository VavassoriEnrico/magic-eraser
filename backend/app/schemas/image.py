from datetime import datetime

from pydantic import BaseModel, ConfigDict

#schemas for the image entity, used for validation and serialization
#this defines the shape of the data sent and received from the API
#it is used to validate the data and to serialize it to json when sending it to the client

class ImageRead(BaseModel):
    id: str
    project_id: str
    fileName: str
    filePath: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ImageFromUrlCreate(BaseModel):
    image_url: str
    file_name: str | None = None
