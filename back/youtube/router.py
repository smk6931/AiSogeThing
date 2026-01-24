from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Annotated
from youtube import service
from user import service as user_service # UUID 조회를 위해 추가
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
async def discover_interest_endpoint(
    req: InterestDiscoverRequest,
    current_user: Annotated[models.User, Depends(get_current_user)]
):
    """
    임의의 키워드로 채널 발굴 및 DB 저장 (Cost: 100)
    1. 유튜브 API로 채널 검색 (Client)
    2. 검색된 채널을 DB에 저장 및 구독 (Service)
    """
    # 1. 채널 발굴 (API Call)
    result = discover_interest_channels(keyword=req.keyword)
    
    if result.get("error"):
        return result

    found_channels = result.get("found_channels", [])
    
    # 2. 결과 반환 (자동 구독 안 함!)
    # 클라이언트가 리스트를 보고 선택해서 구독하도록 변경됨
    return {
        "success": True,
        "added": 0, # 자동 추가 없음
        "found_count": len(found_channels),
        "channels": found_channels, # 상세 정보 포함 반환
        "meta": result.get("meta")
    }

@router.get("/api/youtube/interest")
async def get_interest_endpoint(
    current_user: Annotated[models.User, Depends(get_current_user)],
    keyword: str = None
):
    """
    내 구독 채널의 RSS 영상 가져오기 (Cost: 0)
    1. DB에서 내가 구독한 채널 목록 조회 (Service)
    2. RSS로 최신 영상 긁어오기 (Client)
    """
    # 1. 내 채널 조회 (DB)
    my_channels = await service.get_my_channels(user_id=current_user["id"])
    
    if not my_channels:
        return {"items": [], "channels": [], "message": "구독한 채널이 없습니다."}

    # 2. 영상 긁어오기 (RSS)
    return get_interest_videos(target_keyword=keyword, my_channels=my_channels)


class SubscribeRequest(BaseModel):
    channel_id: str
    channel_name: str

@router.post("/api/youtube/interest/subscribe")
async def subscribe_channel_endpoint(
    req: SubscribeRequest,
    current_user: Annotated[models.User, Depends(get_current_user)]
):
    """
    개별 채널 구독 추가 (영상 카드에서 직접 구독)
    """
    # service.subscribe_channel은 channel_data dict를 기대함
    channel_data = {
        "id": req.channel_id,
        "title": req.channel_name
    }
    return await service.subscribe_channel(
        user_id=current_user["id"],
        channel_data=channel_data,
        keyword="Direct Subscribe" # 직접 구독 표기
    )

class RssRequest(BaseModel):
    channels: list[dict] # [{id: '...', name: '...'}, ...]

@router.post("/api/youtube/interest/rss")
def get_rss_videos_endpoint(req: RssRequest):
    """
    특정 채널 리스트에 대한 RSS 영상 가져오기 (DB와 무관)
    발굴된 채널들의 영상을 미리보기 위해 사용
    """
    # client.get_interest_videos는 my_channels 리스트 포맷을 기대함
    # [{channel_id: '...', name: '...'}, ...]
    
    # 입력 데이터 포맷 맞추기 (Client 쪽에서 id나 channel_id로 줄 수 있으므로)
    # get_interest_videos 내부 로직: channel['channel_id'] 사용
    formatted_channels = []
    for ch in req.channels:
        cid = ch.get('id') or ch.get('channel_id')
        name = ch.get('name') or ch.get('title')
        if cid:
            formatted_channels.append({"channel_id": cid, "name": name})

    return get_interest_videos(target_keyword=None, my_channels=formatted_channels)

class UnsubscribeRequest(BaseModel):
    channel_id: str

@router.post("/api/youtube/interest/unsubscribe")
async def unsubscribe_channel_endpoint(
    req: UnsubscribeRequest,
    current_user: Annotated[models.User, Depends(get_current_user)]
):
    """
    채널 구독 취소
    """
    await service.unsubscribe_channel(user_id=current_user["id"], channel_id=req.channel_id)
    return {"success": True, "message": "구독이 취소되었습니다."}

@router.get("/api/youtube/my-subscriptions")
async def get_my_subscriptions_endpoint(
    current_user: Annotated[models.User, Depends(get_current_user)]
):
    """
    내 구독 리스트 조회 (채널 정보 포함)
    """
    channels = await service.get_my_channels(user_id=current_user["id"])
    return {"success": True, "channels": channels}

# ========================================================
#  Public Profile APIs (다른 사용자 정보 조회)
# ========================================================
@router.get("/api/youtube/user/{user_uuid}/history")
async def get_user_history_endpoint(
    user_uuid: str,
    current_user: Annotated[models.User, Depends(get_current_user)]
):
    """
    특정 사용자의 시청 기록 조회 (로그인 필수)
    - user_uuid: UUID string
    """
    target_user = await user_service.get_user_by_uuid(user_uuid)
    if not target_user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
        
    history = await service.get_view_history(user_id=target_user["id"], limit=20)
    return {"success": True, "history": history}

@router.get("/api/youtube/user/{user_uuid}/subscriptions")
async def get_user_subscriptions_endpoint(
    user_uuid: str,
    current_user: Annotated[models.User, Depends(get_current_user)]
):
    """
    특정 사용자의 구독 채널 리스트 조회 (로그인 필수)
    - user_uuid: UUID string
    """
    target_user = await user_service.get_user_by_uuid(user_uuid)
    if not target_user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")

    channels = await service.get_my_channels(user_id=target_user["id"])
    return {"success": True, "channels": channels}
