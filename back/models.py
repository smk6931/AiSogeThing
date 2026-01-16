from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True) # ID like 'test_user'
    password_hash = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.now)

class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(String, index=True) # Youtube Video ID
    username = Column(String) # For now, store username directly or FK
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.now)

class YoutubeLog(Base):
    __tablename__ = "youtube_logs"
    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(String, index=True)
    title = Column(String)
    action = Column(String) # 'click', 'view'
    created_at = Column(DateTime, default=datetime.now)
