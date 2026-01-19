from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Annotated
from youtube import service
from user.router import get_current_user
from user import models

router = APIRouter()

class VideoLogSchema(BaseModel):
    video_id: str
    title: str
    description: str = None
    thumbnail_url: str = None
    channel_title: str = None

from client.youtube_client import search_videos, get_popular_videos, get_dating_videos, discover_new_channels

class DiscoverRequest(BaseModel):
    category: str = "reality" # 'reality' or 'sketch'

@router.get("/api/youtube/search")
def search_youtube_endpoint(query: str):
    return search_videos(query)

@router.get("/api/youtube/popular")
def popular_youtube_endpoint(categoryId: str = None):
    return get_popular_videos(category_id=categoryId)

@router.get("/api/youtube/dating")
def dating_youtube_endpoint():
    return get_dating_videos()

@router.post("/api/youtube/dating/discover")
def discover_dating_endpoint(req: DiscoverRequest):
    """
    새로운 연애 채널 자동 발굴 (비용 100)
    category: reality(연애/코칭) | sketch(스케치 코미디)
    """
    return discover_new_channels(category=req.category)

@router.post("/api/youtube/log")
async def log_interaction_endpoint(
    video: VideoLogSchema,
    current_user: Annotated[models.User, Depends(get_current_user)]
):
    """
    유튜브 시청 로그 DB 저장 (로그인 유저 전용)
    """
    await service.log_view(current_user["id"], video.dict())
    return {"status": "ok"}

@router.get("/api/youtube/history")
async def get_view_history_endpoint(
    current_user: Annotated[models.User, Depends(get_current_user)]
):
    """
    나의 시청 기록 조회
    """
    return await service.get_view_history(current_user["id"])

# =========================================================
#  사용자 정의 관심사 RSS API
# =========================================================
from client.youtube_client import discover_interest_channels, get_interest_videos

class InterestDiscoverRequest(BaseModel):
    keyword: str

@router.post("/api/youtube/interest/discover")
def discover_interest_endpoint(req: InterestDiscoverRequest):
    """
    임의의 키워드로 채널 발굴 및 저장 (Cost: 100)
    """
    return discover_interest_channels(keyword=req.keyword)

@router.get("/api/youtube/interest")
def get_interest_endpoint(keyword: str = None):
    """
    저장된 관심 채널 영상들을 RSS로 가져오기 (Cost: 0)
    """
    return get_interest_videos(target_keyword=keyword)
