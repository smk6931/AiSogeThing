from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from client.youtube_client import search_videos, get_popular_videos, save_interaction_log

router = APIRouter(
    tags=["Youtube"]
)

class LogRequest(BaseModel):
    id: str
    title: str = ""
    thumbnail: str = ""
    channelTitle: str = ""
    user_id: str = "guest"     # 나중에 실제 유저 ID로 교체
    action: str = "click"

@router.get("/api/youtube/search")
def search_youtube_endpoint(query: str):
    """
    유튜브 영상 검색 API
    """
    if not query:
        raise HTTPException(status_code=400, detail="검색어를 입력해주세요.")
    return search_videos(query)

@router.get("/api/youtube/popular")
def popular_youtube_endpoint(categoryId: str = None):
    """
    인기 유튜브 영상 목록 API
    """
    return get_popular_videos(category_id=categoryId)

@router.post("/api/youtube/log")
def log_interaction_endpoint(log: LogRequest):
    """
    유튜브 영상 클릭 로그 저장
    """
    save_interaction_log(log.dict())
    return {"status": "saved", "id": log.id}
