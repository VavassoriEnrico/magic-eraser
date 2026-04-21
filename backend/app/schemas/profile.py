from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ProfileRead(BaseModel):
    id: str
    created_at: datetime
    name: str | None = None
    surname: str | None = None
    username: str | None = None
    email: str | None = None

    model_config = ConfigDict(from_attributes=True)


class ProfileUpdate(BaseModel):
    name: str | None = None
    surname: str | None = None
    username: str | None = None
