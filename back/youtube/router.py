from fastapi import APIRouter
from pydantic import BaseModel
from client.youtube_client import search_videos, get_popular_videos, save_interaction_log, get_dating_videos, discover_new_channels

router = APIRouter()

class LogRequest(BaseModel):
    id: str
    title: str
    user_id: str = "guest"
    action: str = "click"
    timestamp: str = None

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
def log_interaction_endpoint(log: LogRequest):
    success = save_interaction_log(log.dict())
    return {"success": success}

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
