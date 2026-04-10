from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db.session import Base

#definition of laboratory pipeline entity

class LaboratoryPipeline(Base):
    __tablename__ = "laboratory_pipelines"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    source_image_id = Column(Integer, ForeignKey("images.id"), nullable=False)
    name = Column(String, nullable=True)
    start_image_url = Column(String, nullable=False)
    final_image_url = Column(String, nullable=True)
    status = Column(String, nullable=False, default="running")
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)

    steps = relationship(
        "LaboratoryPipelineStep",
        back_populates="pipeline",
        cascade="all, delete-orphan",
        order_by="LaboratoryPipelineStep.step_index",
    )
