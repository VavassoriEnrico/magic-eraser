from datetime import datetime

from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.session import Base


class LaboratoryPipelineStep(Base):
    __tablename__ = "laboratory_pipeline_steps"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, server_default=text("gen_random_uuid()"))
    pipeline_id = Column(
        UUID(as_uuid=True),
        ForeignKey("laboratory_pipelines.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    step_index = Column(Integer, nullable=False)
    process_type = Column(String, nullable=False)
    priority = Column(Integer, nullable=False)
    model_key = Column(String, nullable=True)
    prompt = Column(Text, nullable=True)
    additional_settings_json = Column(JSON, nullable=True)
    input_image_url = Column(Text, nullable=False)
    mask_image_url = Column(Text, nullable=True)
    output_image_url = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="done")
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)

    pipeline = relationship("LaboratoryPipeline", back_populates="steps")
