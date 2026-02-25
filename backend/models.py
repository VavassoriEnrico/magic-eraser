from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from database import Base

from datetime import datetime

# Project table (id, name, created_at)
class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True) 
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    
    # Allows access to images via project.images, just a Python convenience.
    images = relationship("Image", back_populates="project", cascade="all, delete-orphan")
    

# Image table (id, project_id(FK), fileName, filePath, created_at)
class Image(Base):
    __tablename__ = "images"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    fileName = Column(String, nullable=False)
    filePath = Column(String, nullable=False) 
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    
    # Allows access to the related project via image.project, just a Python convenience.
    project = relationship("Project", back_populates="images")
