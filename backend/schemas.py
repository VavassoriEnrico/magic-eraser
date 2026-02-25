from pydantic import BaseModel, ConfigDict

from datetime import datetime


class ProjectCreate(BaseModel):
    name : str
    
class ImageCreate(BaseModel):
    fileName: str
    filePath: str


class Project(BaseModel):
    id: int
    name: str
    created_at: datetime
    
    # Read directly from database objects
    model_config = ConfigDict(from_attributes = True)
    
class Image(BaseModel):
    id: int
    project_id: int
    fileName: str
    filePath: str
    created_at: datetime
    
    # Read directly from database objects
    model_config=ConfigDict(from_attributes=True)
