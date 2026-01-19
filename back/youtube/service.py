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
    2. UserLog에 시청 기록 저장
    """
    video_id = video_data.get("video_id")
    if not video_id:
        return

    # 1. 영상 메타데이터 저장 (이미 있으면 패스 - 중복 방지)
    # Postgres의 ON CONFLICT DO NOTHING을 쓰면 좋지만, 여기선 간단히 SELECT 후 INSERT
    check_sql = "SELECT id FROM youtube_list WHERE video_id = :video_id"
    existing_video = await fetch_one(check_sql, {"video_id": video_id})

    if not existing_video:
        # 1. 영상 메타데이터 저장 (직관적으로 SQL + 파라미터 결합)
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

    # 2. 유저 로그 저장
    # 2. 유저 로그 저장
    await execute(
        """
        INSERT INTO user_logs (user_id, content_type, content_id, action)
        VALUES (:user_id, :content_type, :video_id, :action)
        """,
        {
            "user_id": user_id, 
            "content_type": "youtube", 
            "video_id": video_id, 
            "action": "view"
        }
    )


async def get_view_history(user_id: int, limit: int = 20):
    """
    유저의 시청 기록 조회 (YoutubeList와 JOIN)
    """
    sql = """
        SELECT 
            ul.created_at as viewed_at,
            y.video_id,
            y.title,
            y.thumbnail_url,
            y.channel_title
        FROM user_logs ul
        JOIN youtube_list y ON ul.content_id = y.video_id
        WHERE ul.user_id = :user_id 
          AND ul.content_type = 'youtube' 
          AND ul.action = 'view'
        ORDER BY ul.created_at DESC
        LIMIT :limit
    """
    return await fetch_all(sql, {"user_id": user_id, "limit": limit})
