from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Annotated
from youtube import service
from user import service as user_service # UUID 조회를 위해 추가
from user.router import get_current_user
from user import models
from core.database import fetch_all, fetch_one

router = APIRouter()


class VideoLogSchema(BaseModel):
    video_id: str
    title: str
    description: str = None
    thumbnail_url: str = None
    channel_title: str = None

from client.youtube_client import search_videos, get_popular_videos, get_dating_videos, discover_new_channels
from youtube.taste_analyzer import analyze_user_taste


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

class VideoTimeSchema(BaseModel):
    log_id: int
    watched: int
    total: int | None = None

@router.post("/api/youtube/log")
async def log_interaction_endpoint(
    video: VideoLogSchema,
    current_user: Annotated[models.User, Depends(get_current_user)]
):
    """
    유튜브 시청 로그 DB 저장 (로그인 유저 전용)
    """
    result = await service.log_view(current_user["id"], video.dict())
    return result

@router.post("/api/youtube/log/time")
async def update_time_endpoint(
    data: VideoTimeSchema,
    current_user: Annotated[models.User, Depends(get_current_user)]
):
    """
    시청 시간 업데이트 (종료 시점)
    """
    return await service.update_video_time(data.log_id, data.watched, data.total)

@router.get("/api/youtube/history")
async def get_view_history_endpoint(
    current_user: Annotated[models.User, Depends(get_current_user)]
):
    """
    나의 시청 기록 조회
    """
    return await service.get_view_history(current_user["id"])

@router.get("/api/youtube/taste")
async def get_user_taste_endpoint(
    current_user: Annotated[models.User, Depends(get_current_user)]
):
    """
    사용자 취향 분석 (구독 채널 기반)
    """
    return await analyze_user_taste(current_user["id"])


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

    # 2. 영상 긁어오기 (RSS) - 실시간으로만 보여주고 DB 저장 안 함
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

# =========================================================
#  채널 발굴 & 리스트 API (New UI)
# =========================================================

@router.get("/api/youtube/channels/list")
async def get_channels_list_endpoint(
    current_user: Annotated[models.User, Depends(get_current_user)],
    search: str = None,
    category: str = None,
    limit: int = 50,
    offset: int = 0
):
    """
    채널 리스트 조회 (발굴된 채널 + 구독 정보)
    - search: 채널명 또는 키워드 검색
    - category: 카테고리 필터
    - limit/offset: 페이징
    """
    where_clauses = []
    params = {"limit": limit, "offset": offset, "user_id": current_user["id"]}
    
    if search:
        where_clauses.append("(c.name ILIKE :search OR c.keywords ILIKE :search OR c.description ILIKE :search)")
        params["search"] = f"%{search}%"
    
    if category:
        where_clauses.append("c.category = :category")
        params["category"] = category
    
    where_str = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""
    
    sql = f"""
        SELECT 
            c.channel_id,
            c.name,
            c.keywords,
            c.category,
            c.description,
            c.thumbnail_url,
            c.created_at,
            CASE WHEN ul.id IS NOT NULL THEN true ELSE false END as is_subscribed
        FROM youtube_channels c
        LEFT JOIN user_logs ul ON ul.content_id = c.channel_id 
            AND ul.user_id = :user_id 
            AND ul.content_type = 'youtube_channel' 
            AND ul.action = 'subscribe'
        {where_str}
        ORDER BY c.created_at DESC
        LIMIT :limit OFFSET :offset
    """
    
    channels = await fetch_all(sql, params)
    
    return {
        "channels": [dict(ch) for ch in channels],
        "count": len(channels),
        "offset": offset,
        "limit": limit
    }

@router.get("/api/youtube/channels/{channel_id}")
async def get_channel_detail_endpoint(
    channel_id: str,
    current_user: Annotated[models.User, Depends(get_current_user)]
):
    """
    특정 채널 상세 정보 조회
    """
    sql = """
        SELECT 
            c.channel_id,
            c.name,
            c.keywords,
            c.category,
            c.description,
            c.created_at,
            CASE WHEN ul.id IS NOT NULL THEN true ELSE false END as is_subscribed
        FROM youtube_channels c
        LEFT JOIN user_logs ul ON ul.content_id = c.channel_id 
            AND ul.user_id = :user_id 
            AND ul.content_type = 'youtube_channel' 
            AND ul.action = 'subscribe'
        WHERE c.channel_id = :channel_id
    """
    
    channel = await fetch_one(sql, {"channel_id": channel_id, "user_id": current_user["id"]})
    
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    return dict(channel)

@router.get("/api/youtube/videos/feed")
async def get_videos_feed_endpoint(
    sort_by: str = "newest",  # "newest" or "popular"
    country: str = None,
    category: str = None,
    limit: int = 50,
    offset: int = 0
):
    """
    영상 피드 조회 (DB 수집 영상)
    - sort_by: "newest" (최신순) | "popular" (조회수순)
    - country, category: 필터
    - limit/offset: 페이징
    """
    videos = await service.get_collected_videos(
        country=country,
        category=category,
        limit=limit,
        offset=offset,
        sort_by=sort_by
    )
    
    return {
        "videos": videos,
        "count": len(videos),
        "offset": offset,
        "sort_by": sort_by
    }


# =========================================================
#  API 실시간 탐색 (Live API Call)
# =========================================================

@router.get("/api/youtube/search/live")
async def get_live_search_endpoint(
    country: str = "KR",
    category: str = None, # None이면 전체 인기
    limit: int = 20
):
    """
    YouTube API 실시간 인기 급상승 조회 (DB 저장 X)
    """
    try:
        videos_data = get_popular_videos(
            region_code=country,
            category_id=category,
            max_results=limit
        )
        # get_popular_videos returns {'items': [...], 'meta': ...}
        # We need to return the list directly or wrapper correctly
        return {"videos": videos_data.get("items", [])}
    except Exception as e:
        print(f"Error fetching live videos: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/youtube/search/channels")
async def search_channels_endpoint(
    query: str,
    limit: int = 15
):
    """
    채널 검색 (Admin 수집용)
    검색 즉시 모든 채널을 DB에 자동 저장!
    """
    try:
        from client.youtube_client import discover_interest_channels
        
        print(f"[Channel Search] Keyword: {query}")
        result = discover_interest_channels(query)
        
        # 에러 체크
        if "error" in result:
            print(f"[Channel Search] Error: {result['error']}")
            raise HTTPException(status_code=500, detail=result["error"])
        
        # 채널 리스트 추출
        channels = result.get("found_channels", [])
        print(f"[Channel Search] Found {len(channels)} channels")
        
        # 🔥 검색 즉시 모든 채널 DB 저장 (자동!)
        for ch in channels:
            try:
                await service.add_channel(
                    channel_id=ch["id"],
                    name=ch["name"],
                    keywords=query,
                    category=query,  # 검색어를 카테고리로 저장! (Null 방지)
                    thumbnail_url=ch.get("thumbnail"),
                    description=ch.get("description")
                )
                print(f"  ✅ Saved: {ch.get('name', 'Unknown')} (ID: {ch.get('id', 'N/A')})")
            except Exception as save_error:
                print(f"  ⚠️ Failed to save {ch.get('name')}: {save_error}")
        
        # 썸네일 포함하여 프론트로 반환
        enriched_channels = []
        for ch in channels:
            enriched_channels.append({
                "id": ch["id"],
                "name": ch["name"],
                "keyword": ch.get("keyword", query),
                "thumbnail": ch.get("thumbnail", "https://yt3.ggpht.com/ytc/default_profile.jpg"),
                "description": ch.get("description", "")
            })
        
        return {
            "channels": enriched_channels,
            "meta": result.get("meta", {}),
            "auto_saved": len(channels)  # 자동 저장 개수
        }
    except Exception as e:
        print(f"[Channel Search] Exception: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))



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

@router.get("/api/youtube/recommend/random")
async def get_random_video_endpoint(
    current_user: Annotated[models.User, Depends(get_current_user)]
):
    """
    랜덤 비디오 추천 (무한 스크롤용)
    """
    video = await service.get_random_video()
    if not video:
        raise HTTPException(status_code=404, detail="저장된 영상이 없습니다.")
    return {"success": True, "video": video}

@router.post("/api/youtube/admin/collect")
async def collect_global_trends_endpoint(background_tasks: BackgroundTasks):
    """
    [Admin] 글로벌 인기 영상 수집기 실행
    백그라운드에서 실행되므로 요청은 즉시 반환됨.
    """
    background_tasks.add_task(service.collect_global_trends)
    return {"status": "started", "message": "Global trend collection started in background."}

@router.get("/api/youtube/db-list")
async def get_db_videos_endpoint(country: str = None, category: str = None, limit: int = 50):
    """
    수집된 영상 목록 조회 (DB) - API Cost 0
    """
    items = await service.get_collected_videos(country, category, limit)
    return {"items": items, "count": len(items)}

class CollectSpecificRequest(BaseModel):
    country: str
    category: str | None = None

@router.post("/api/youtube/admin/collect-one")
async def collect_one_trend_endpoint(req: CollectSpecificRequest, background_tasks: BackgroundTasks):
    """
    [Admin] 특정 국가/카테고리 수집 (점진적 수집)
    """
    background_tasks.add_task(service.collect_trend_one, req.country, req.category)
    return {"status": "started", "message": f"Collect {req.country} - {req.category} started."}


class SaveChannelRequest(BaseModel):
    channel_id: str
    channel_name: str
    keyword: str
    thumbnail_url: str | None = None  # 썸네일 추가

@router.post("/api/youtube/admin/save-channel")
async def admin_save_channel_endpoint(req: SaveChannelRequest):
    """
    [Admin] 검색한 채널을 DB에 저장
    """
    try:
        # DB에 채널 저장
        await service.add_channel(
            channel_id=req.channel_id,
            name=req.channel_name,
            keywords=req.keyword,
            category=None,
            thumbnail_url=req.thumbnail_url  # 썸네일 전달
        )
        
        print(f"[Admin] Channel saved: {req.channel_name} (ID: {req.channel_id})")
        
        return {
            "success": True,
            "channel_id": req.channel_id,
            "channel_name": req.channel_name
        }
    except Exception as e:
        print(f"[Admin Save Channel] Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


class SubscribeChannelRequest(BaseModel):
    channel_id: str

@router.post("/api/youtube/channel/subscribe")
async def subscribe_channel_endpoint(
    req: SubscribeChannelRequest,
    current_user: Annotated[models.User, Depends(get_current_user)]
):
    """
    채널 구독 (user_logs에 기록)
    """
    try:
        # user_logs에 구독 기록
        insert_sql = """
            INSERT INTO user_logs (user_id, content_type, content_id, action, created_at)
            VALUES (:uid, 'youtube_channel', :cid, 'subscribe', NOW())
        """
        await execute(insert_sql, {"uid": current_user.id, "cid": req.channel_id})
        
        print(f"[Subscribe] User {current_user.id} subscribed to channel {req.channel_id}")
        
        return {"success": True, "channel_id": req.channel_id}
    except Exception as e:
        print(f"[Subscribe] Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
