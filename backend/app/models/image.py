from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db.session import Base


class Image(Base):
    __tablename__ = "images"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    fileName = Column(String, nullable=False)
    filePath = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.now, nullable=False)

    project = relationship("Project", back_populates="images")
