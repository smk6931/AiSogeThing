from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from core.database import Base

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(String, index=True)          # 유튜브 비디오 ID
    username = Column(String)                      # 작성자 (일단 문자열로, 나중에 User FK 연결 가능)
    content = Column(Text)                         # 댓글 내용
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class YoutubeLog(Base):
    __tablename__ = "youtube_logs"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(String, index=True)
    title = Column(String)
    action = Column(String)                        # 행동 유형 ('click', 'view' 등)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
