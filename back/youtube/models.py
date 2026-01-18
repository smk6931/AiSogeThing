from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from core.database import Base

class Comment(Base):
    """통합 댓글 테이블 (유튜브, 맛집, 피드 등)"""
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    content_type = Column(String, nullable=False, index=True)      # 'youtube', 'hotplace', 'feed'
    content_id = Column(String, nullable=False, index=True)        # 해당 콘텐츠의 ID (Youtube는 문자열 ID, 나머지는 정수일 수 있음)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=True) # 작성자 ID (회원제)
    username = Column(String, nullable=True)                       # 비회원일 경우 또는 닉네임 캐싱
    content = Column(Text, nullable=False)                         # 댓글 내용
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class YoutubeList(Base):
    """수집된 유튜브 영상 리스트 (메타데이터)"""
    __tablename__ = "youtube_list"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(String, unique=True, index=True, nullable=False)  # 유튜브 비디오 ID
    title = Column(String, nullable=False)                              # 제목
    description = Column(Text, nullable=True)                           # 설명
    thumbnail_url = Column(String, nullable=True)                       # 썸네일
    channel_title = Column(String, nullable=True)                       # 채널명
    tags = Column(Text, nullable=True)                                  # 태그
    duration = Column(String, nullable=True)                            # 길이
    view_count = Column(Integer, nullable=True)                         # 조회수
    published_at = Column(DateTime(timezone=True), nullable=True)       # 업로드일
    created_at = Column(DateTime(timezone=True), server_default=func.now()) # 수집일


class UserLog(Base):
    """유저 통합 활동 로그 (클릭, 좋아요, 조회 등)"""
    __tablename__ = "user_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False, index=True)
    content_type = Column(String, nullable=False, index=True)      # 'youtube', 'hotplace'
    content_id = Column(String, nullable=False)                    # 콘텐츠 ID
    action = Column(String, nullable=False)                        # 'click', 'like', 'view'
    metadata_json = Column(Text, nullable=True)                    # 추가 정보 (JSON 형태)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
