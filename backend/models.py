from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from database import Base

from datetime import datetime

#Project Table (id, name, created_at)
class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True) 
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    
    #utile per poter accedere alle immagini tramite project.images, solo una comodità python
    images = relationship("Image", back_populates="project", cascade="all, delete-orphan")
    

#Image Table (id, project_id(FK), fileName, filePath, created_at)
class Image(Base):
    __tablename__ = "images"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    fileName = Column(String, nullable=False)
    filePath = Column(String, nullable=False) 
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    
    #utile per poter accedere al progetto a cui è associata tramite image.project, solo una comodità python
    project = relationship("Project", back_populates="images")