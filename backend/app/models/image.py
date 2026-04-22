from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.session import Base

#definition the image entity. 
# many to one relationship with project
# properties: id, project_id, fileName, filePath, created_at

class Image(Base):
    __tablename__ = "images"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, server_default=text("gen_random_uuid()"))
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    fileName = Column(String, nullable=False)
    filePath = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.now, nullable=False)

    project = relationship("Project", back_populates="images")
