from datetime import datetime

from sqlalchemy import Column, DateTime, String, Text

from app.db.session import Base


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(String, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    name = Column(Text, nullable=True)
    surname = Column(Text, nullable=True)
    username = Column(Text, nullable=True)
    email = Column(Text, nullable=True)
