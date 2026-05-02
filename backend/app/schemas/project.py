from datetime import datetime

from pydantic import BaseModel, ConfigDict

#schemas for the project entity, used for validation and serialization
#this defines the shape of the data sent and received from the API
#it is used to validate the data and to serialize it to json when sending it to the client
#for example: while creating and updating a project, we need only the name, 
#while when reading a project we need all the properties.
class ProjectCreate(BaseModel):
    name: str


class ProjectUpdate(BaseModel):
    name: str


class ProjectRead(BaseModel):
    id: str
    name: str
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
