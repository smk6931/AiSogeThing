from core.database import execute, fetch_one, fetch_all, insert_and_return
from youtube import models
import json
from datetime import datetime

# ========================================================
#  유튜브 시청 기록 및 로그 서비스
# ========================================================

async def log_view(user_id: int, video_data: dict):
    """
    유튜브 시청 로그 저장 + 영상 메타데이터 저장 (Upsert 개념)
    1. YoutubeList에 영상 정보가 없으면 저장 (Source of Truth)
    2. UserLog에 시청 기록 저장 (이미 본 적 있으면 Skip)
    """
    video_id = video_data.get("video_id")
    if not video_id:
        return

    # 1. 영상 메타데이터 저장 (이미 있으면 패스)
    check_sql = "SELECT id FROM youtube_list WHERE video_id = :video_id"
    existing_video = await fetch_one(check_sql, {"video_id": video_id})

    if not existing_video:
        await execute(
            """
            INSERT INTO youtube_list (video_id, title, description, thumbnail_url, channel_title, published_at)
            VALUES (:video_id, :title, :description, :thumbnail_url, :channel_title, :published_at)
            """,
            {
                "video_id": video_id,
                "title": video_data.get("title", "Unknown"),
                "description": video_data.get("description", ""),
                "thumbnail_url": video_data.get("thumbnail_url", ""),
                "channel_title": video_data.get("channel_title", ""),
                "published_at": None
            }
        )

    # 2. 영상 시청 기록 생성 (UserYoutubeLog)
    # 별도 테이블에 상세 정보를 저장함 (중복 체크 없이 세션별 저장)
    sql = """
        INSERT INTO user_youtube_logs 
            (user_id, video_id, watched_seconds, total_seconds, progress_percent, created_at, updated_at)
        VALUES 
            (:user_id, :video_id, 0, 0, 0.0, NOW(), NOW())
        RETURNING id
    """
    
    log_record = await fetch_one(sql, {
        "user_id": user_id, 
        "video_id": video_id
    })
    
    return {"status": "logged", "log_id": log_record["id"]}


async def update_video_time(log_id: int, watched: int, total: int):
    """
    시청 시간 업데이트 (영상 종료/이탈 시 호출)
    """
    # 퍼센트 계산
    percent = 0.0
    if total > 0:
        percent = round((watched / total) * 100, 2)
        if percent > 100: percent = 100.0

    sql = """
        UPDATE user_youtube_logs 
        SET watched_seconds = :w, 
            total_seconds = :t, 
            progress_percent = :p,
            updated_at = NOW()
        WHERE id = :log_id
    """
    await execute(sql, {"w": watched, "t": total, "p": percent, "log_id": log_id})
    return {"status": "updated", "watched": watched, "percent": percent}


async def get_view_history(user_id: int, limit: int = 20):
    """
    유저의 시청 기록 조회 (YoutubeList와 JOIN)
    """
    sql = """
        SELECT 
            ul.created_at as viewed_at,
            ul.updated_at as last_viewed_at,
            ul.watched_seconds,
            ul.progress_percent,
            y.video_id,
            y.title,
            y.thumbnail_url,
            y.channel_title
        FROM user_youtube_logs ul
        JOIN youtube_list y ON ul.video_id = y.video_id
        WHERE ul.user_id = :user_id 
        ORDER BY ul.updated_at DESC
        LIMIT :limit
    """
    return await fetch_all(sql, {"user_id": user_id, "limit": limit})


# ========================================================
#  [New] 채널 구독 및 개인화 서비스
# ========================================================

async def subscribe_channel(user_id: int, channel_data: dict, keyword: str = ""):
    """
    채널 구독 및 정보 캐싱
    1. YoutubeChannel 테이블에 채널 정보 저장 (없으면 Insert, 있으면 Skip/Update)
    2. UserLog 테이블에 구독 기록 저장 (중복 방지)
    """
    # 데이터 표준화
    channel_id = channel_data.get("id") or channel_data.get("channelId")
    channel_name = channel_data.get("title") or channel_data.get("channelTitle") or channel_data.get("name")
    
    if not channel_id or not channel_name:
        return {"error": "Invalid channel data"}

    # 1. 채널 테이블 확인 및 캐싱
    check_ch_sql = "SELECT id, keywords FROM youtube_channels WHERE channel_id = :cid"
    existing_ch = await fetch_one(check_ch_sql, {"cid": channel_id})

    if not existing_ch:
        # 신규 채널 등록 (키워드도 함께 저장)
        await execute(
            """
            INSERT INTO youtube_channels (channel_id, name, keywords)
            VALUES (:cid, :name, :kw)
            """,
            {
                "cid": channel_id,
                "name": channel_name,
                "kw": keyword
            }
        )
    else:
        # 기존 채널이면 pass (추후 키워드 업데이트 로직 추가 가능)
        pass

    # 2. 유저 구독 로그 저장 (이미 구독했는지 확인)
    check_sub_sql = """
        SELECT id FROM user_logs 
        WHERE user_id = :uid 
          AND content_type = 'youtube_channel' 
          AND content_id = :cid 
          AND action = 'subscribe'
    """
    is_subscribed = await fetch_one(check_sub_sql, {"uid": user_id, "cid": channel_id})

    if not is_subscribed:
        await execute(
            """
            INSERT INTO user_logs (user_id, content_type, content_id, action)
            VALUES (:uid, 'youtube_channel', :cid, 'subscribe')
            """,
            {
                "uid": user_id, 
                "cid": channel_id
            }
        )
        return {"status": "subscribed", "message": f"'{channel_name}' 채널을 구독했습니다."}
    
    return {"status": "already_subscribed", "message": "이미 구독중인 채널입니다."}


async def get_my_channels(user_id: int):
    """
    내가 구독한 채널 목록 조회 (최신순)
    """
    sql = """
        SELECT 
            c.channel_id,
            c.name,
            c.keywords,
            ul.created_at as subscribed_at
        FROM user_logs ul
        JOIN youtube_channels c ON ul.content_id = c.channel_id
        WHERE ul.user_id = :uid
          AND ul.content_type = 'youtube_channel'
          AND ul.action = 'subscribe'
        ORDER BY ul.created_at DESC
    """
    return await fetch_all(sql, {"uid": user_id})


async def unsubscribe_channel(user_id: int, channel_id: str):
    """
    구독 취소 (UserLog에서 제거)
    """
    # 물리적 삭제 (구독 상태 해제)
    sql = """
        DELETE FROM user_logs 
        WHERE user_id = :uid 
          AND content_type = 'youtube_channel' 
          AND content_id = :cid 
          AND action = 'subscribe'
    """
    await execute(sql, {"uid": user_id, "cid": channel_id})

async def get_random_video():
    """
    DB에 저장된 영상 중 랜덤으로 1개를 가져옴 (쇼츠 감성 무한 스크롤용)
    """
    # PostgreSQL의 RANDOM() 함수 사용
    sql = """
        SELECT video_id, title, thumbnail_url, channel_title, description
        FROM youtube_list
        ORDER BY RANDOM()
        LIMIT 1
    """
    return await fetch_one(sql)
