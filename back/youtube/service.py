from core.database import execute, fetch_one, fetch_all, insert_and_return
from youtube import models
import json
from client.youtube_client import get_popular_videos
from datetime import datetime
from utils.safe_ops import safe_execute


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
        # duration 파싱해서 is_short 판별 (60초 이하)
        duration = video_data.get("duration", 0)  # 초 단위
        is_short = 1 if (duration > 0 and duration <= 60) else 0
        
        await execute(
            """
            INSERT INTO youtube_list (video_id, title, description, thumbnail_url, channel_title, duration, is_short, published_at)
            VALUES (:video_id, :title, :description, :thumbnail_url, :channel_title, :duration, :is_short, :published_at)
            """,
            {
                "video_id": video_id,
                "title": video_data.get("title", "Unknown"),
                "description": video_data.get("description", ""),
                "thumbnail_url": video_data.get("thumbnail_url", ""),
                "channel_title": video_data.get("channel_title", ""),
                "duration": str(duration) if duration else None,
                "is_short": is_short,
                "published_at": None
            }
        )

    # 2. 영상 시청 기록 생성 (UserYoutubeLog)
    sql = """
        INSERT INTO user_youtube_logs 
            (user_id, video_id, watched_seconds, created_at, updated_at)
        VALUES 
            (:user_id, :video_id, 0, NOW(), NOW())
        RETURNING id
    """
    
    log_record = await fetch_one(sql, {
        "user_id": user_id, 
        "video_id": video_id
    })
    
    return {"status": "logged", "log_id": log_record["id"]}


async def update_video_time(log_id: int, watched: int, total: int = None):
    """
    시청 시간 업데이트 (영상 종료/이탈 시 호출)
    total 파라미터는 호환성을 위해 유지하지만 사용하지 않음
    """
    sql = """
        UPDATE user_youtube_logs 
        SET watched_seconds = :w,
            updated_at = NOW()
        WHERE id = :log_id
    """
    await execute(sql, {"w": watched, "log_id": log_id})
    return {"status": "updated", "watched": watched}


async def get_view_history(user_id: int, limit: int = 20):
    """
    유저의 시청 기록 조회 (YoutubeList와 JOIN)
    """
    sql = """
        SELECT 
            ul.created_at as viewed_at,
            ul.updated_at as last_viewed_at,
            ul.watched_seconds,
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

async def collect_global_trends():
    """
    [CRON] 글로벌 인기 영상 대량 수집 (All-in-One 전략)
    KR, US, JP 등 주요 국가의 카테고리별 인기 영상을 긁어서 DB에 저장.
    Cost: API 호출 1회당 50개 영상 메타데이터(태그,길이,조회수) 획득 (가성비 최강)
    """
    target_countries = ['KR', 'US', 'JP']
    # None(전체), 10(음악), 20(게임), 24(엔터), 17(스포츠), 25(뉴스)
    target_categories = [None, '10', '20', '24'] 
    
    total_processed = 0
    new_videos = 0
    
    print(f"🌍 [Collector] Starting global trend collection...")
    
    for country in target_countries:
        for category in target_categories:
            next_page_token = None
            
            # 카테고리당 최대 4페이지 (약 200개) 스캔
            for page in range(4):
                with safe_execute(f"Collection Error ({country}-{category})"):
                    res = get_popular_videos(
                        max_results=50, 
                        region_code=country, 
                        category_id=category, 
                        page_token=next_page_token
                    )
                    
                    if "error" in res:
                        print(f"❌ API Error ({country}-{category}): {res['error']}")
                        break
                        
                    items = res.get("items", [])
                    if not items: break
                    
                    for item in items:
                        vid = item['id']
                        
                        # 이미 있는지 확인
                        check_sql = "SELECT id FROM youtube_list WHERE video_id = :vid"
                        existing = await fetch_one(check_sql, {"vid": vid})
                        
                        tags_str = ",".join(item.get('tags', [])) if item.get('tags') else ""
                        duration = str(item['duration'])
                        is_short = 1 if (item['duration'] and item['duration'] <= 60) else 0
                        
                        # 날짜 파싱 (ISO 8601 -> datetime)
                        pub_dt = None
                        if item.get('publishedAt'):
                            try:
                                pub_dt = datetime.fromisoformat(item['publishedAt'].replace('Z', '+00:00'))
                            except ValueError:
                                pub_dt = datetime.now() # 파싱 실패 시 현재 시간

                        if not existing:
                            # 신규 저장
                            insert_sql = """
                                INSERT INTO youtube_list 
                                (video_id, title, description, thumbnail_url, channel_title, channel_id, tags, duration, is_short, view_count, published_at, country_code, category_id)
                                VALUES 
                                (:vid, :title, :desc, :thumb, :ch_title, :ch_id, :tags, :dur, :short, :views, :pub, :cc, :cat)
                            """
                            await execute(insert_sql, {
                                "vid": vid,
                                "title": item['title'],
                                "desc": item['description'][:500] if item.get('description') else "", # 너무 길면 자름
                                "thumb": item['thumbnail'],
                                "ch_title": item['channelTitle'],
                                "ch_id": item['channelId'],
                                "tags": tags_str,
                                "dur": duration,
                                "short": is_short,
                                "views": int(item['viewCount']) if item['viewCount'] else 0,
                                "pub": pub_dt,
                                "cc": country,
                                "cat": item.get('categoryId')
                            })
                            new_videos += 1
                        else:
                            # 업데이트 (국가 정보 등 갱신)
                            update_sql = """
                                UPDATE youtube_list 
                                SET view_count = :views,
                                    tags = COALESCE(NULLIF(tags, ''), :tags),
                                    duration = COALESCE(duration, :dur),
                                    is_short = COALESCE(is_short, :short),
                                    country_code = COALESCE(country_code, :cc),
                                    category_id = COALESCE(category_id, :cat)
                                WHERE video_id = :vid
                            """
                            await execute(update_sql, {
                                "views": int(item['viewCount']) if item['viewCount'] else 0,
                                "tags": tags_str,
                                "dur": duration,
                                "short": is_short,
                                "vid": vid,
                                "cc": country,
                                "cat": item.get('categoryId')
                            })
                            
                        total_processed += 1
                        
                    next_page_token = res.get("nextPageToken")
                    if not next_page_token: break
                    
    print(f"🏁 [Collector] Finished. Scanned: {total_processed}, New: {new_videos}")
    return {"status": "success", "processed": total_processed, "new": new_videos}

async def collect_trend_one(country: str, category: str = None):
    """
    [Admin] 특정 국가/카테고리만 콕 집어서 수집 (200개)
    Cost: 약 4 Unit
    """
    total_processed = 0
    new_videos = 0
    next_page_token = None
    
    # category가 'null' 문자열로 오면 None으로 변환
    if category == 'null' or category == 'undefined':
        category = None
        
    print(f"🎯 [Collector-One] Start {country} - {category}")

    # 최대 4페이지 (약 200개) 스캔
    for page in range(4):
        with safe_execute(f"Collection Error ({country}-{category})"):
            res = get_popular_videos(
                max_results=50, 
                region_code=country, 
                category_id=category, 
                page_token=next_page_token
            )
            
            if "error" in res:
                print(f"❌ API Error ({country}-{category}): {res['error']}")
                break
                
            items = res.get("items", [])
            if not items: break
            
            for item in items:
                vid = item['id']
                
                # 이미 있는지 확인
                check_sql = "SELECT id FROM youtube_list WHERE video_id = :vid"
                existing = await fetch_one(check_sql, {"vid": vid})
                
                tags_str = ",".join(item.get('tags', [])) if item.get('tags') else ""
                duration = str(item['duration'])
                is_short = 1 if (item['duration'] and item['duration'] <= 60) else 0
                
                # 날짜 파싱 (ISO 8601 -> datetime)
                pub_dt = None
                if item.get('publishedAt'):
                    try:
                        pub_dt = datetime.fromisoformat(item['publishedAt'].replace('Z', '+00:00'))
                    except ValueError:
                        pub_dt = datetime.now()

                if not existing:
                    # 신규 저장
                    insert_sql = """
                        INSERT INTO youtube_list 
                        (video_id, title, description, thumbnail_url, channel_title, channel_id, tags, duration, is_short, view_count, published_at, country_code, category_id)
                        VALUES 
                        (:vid, :title, :desc, :thumb, :ch_title, :ch_id, :tags, :dur, :short, :views, :pub, :cc, :cat)
                    """
                    await execute(insert_sql, {
                        "vid": vid,
                        "title": item['title'],
                        "desc": item['description'][:500] if item.get('description') else "", # 너무 길면 자름
                        "thumb": item['thumbnail'],
                        "ch_title": item['channelTitle'],
                        "ch_id": item['channelId'],
                        "tags": tags_str,
                        "dur": duration,
                        "short": is_short,
                        "views": int(item['viewCount']) if item['viewCount'] else 0,
                        "pub": pub_dt,
                        "cc": country,
                        "cat": item.get('categoryId')
                    })
                    new_videos += 1
                else:
                    # 업데이트
                    update_sql = """
                        UPDATE youtube_list 
                        SET view_count = :views,
                            tags = COALESCE(NULLIF(tags, ''), :tags),
                            duration = COALESCE(duration, :dur),
                            is_short = COALESCE(is_short, :short),
                            country_code = COALESCE(country_code, :cc),
                            category_id = COALESCE(category_id, :cat)
                        WHERE video_id = :vid
                    """
                    await execute(update_sql, {
                        "views": int(item['viewCount']) if item['viewCount'] else 0,
                        "tags": tags_str,
                        "dur": duration,
                        "short": is_short,
                        "vid": vid,
                        "cc": country,
                        "cat": item.get('categoryId')
                    })
                    
                total_processed += 1
                
            next_page_token = res.get("nextPageToken")
            if not next_page_token: break
            
    print(f"✅ [Collector-One] Finished. Scanned: {total_processed}, New: {new_videos}")
    return {"status": "success", "processed": total_processed, "new": new_videos}
