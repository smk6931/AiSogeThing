
import asyncio
import os
import sys
import random
import re
from datetime import timedelta

# 프로젝트 루트 경로 추가 (back 폴더의 모듈을 로드하기 위함)
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir) # c:/GitHub/AiSogeThing
back_dir = os.path.join(project_root, 'back')
sys.path.append(back_dir)

from core.database import async_session_factory, engine
from sqlalchemy import text

# ISO 8601 Duration 파서 (PT1H2M3S -> seconds)
def parse_duration(duration_str):
    if not duration_str:
        return 180 # 기본값 3분

    # PT#H#M#S 형식 정규식
    pattern = re.compile(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?')
    match = pattern.match(duration_str)
    
    if not match:
        return 180 # 파싱 실패 시 기본값

    h = int(match.group(1)) if match.group(1) else 0
    m = int(match.group(2)) if match.group(2) else 0
    s = int(match.group(3)) if match.group(3) else 0

    return (h * 3600) + (m * 60) + s

async def migrate_logs():
    print("🚀 [Migration] Start migrating UserLog -> UserYoutubeLog...")
    
    async with async_session_factory() as session:
        # 1. 기존 user_logs에서 유튜브 시청 기록만 가져오기 (youtube_list와 조인하여 duration 확보)
        # content_type='youtube' AND action='view'
        # 주의: youtube_list에 없는 영상 로그는 duration을 알 수 없으므로 LEFT JOIN
        
        select_sql = text("""
            SELECT 
                ul.id as log_id,
                ul.user_id,
                ul.content_id as video_id,
                ul.created_at,
                yl.duration
            FROM user_logs ul
            LEFT JOIN youtube_list yl ON ul.content_id = yl.video_id
            WHERE ul.content_type = 'youtube' 
              AND ul.action = 'view'
        """)
        
        result = await session.execute(select_sql)
        logs = result.fetchall()
        
        print(f"📊 Found {len(logs)} legacy logs to migrate.")
        
        migrated_count = 0
        
        for log in logs:
            # 이미 마이그레이션 된 건지 확인 (중복 방지)
            check_sql = text("""
                SELECT id FROM user_youtube_logs 
                WHERE user_id = :uid AND video_id = :vid AND created_at = :cat
            """)
            exists = await session.execute(check_sql, {
                "uid": log.user_id, 
                "vid": log.video_id,
                "cat": log.created_at
            })
            
            if exists.first():
                continue # 이미 존재하면 스킵
            
            # --- [핵심 로직] 랜덤 시청 시간 생성 ---
            
            # 1) 영상 총 길이 (초) 계산
            total_seconds = parse_duration(log.duration)
            if total_seconds == 0: total_seconds = 180 # 0초면 기본값
            
            # 2) 랜덤 진척률 (5% ~ 95%)
            progress_percent = round(random.uniform(5.0, 95.0), 2)
            
            # 3) 시청 시간 계산
            watched_seconds = int(total_seconds * (progress_percent / 100))
            
            # 4) Insert
            insert_sql = text("""
                INSERT INTO user_youtube_logs 
                (user_id, video_id, watched_seconds, total_seconds, progress_percent, created_at, updated_at)
                VALUES (:uid, :vid, :ws, :ts, :pp, :cat, :cat)
            """)
            
            await session.execute(insert_sql, {
                "uid": log.user_id,
                "vid": log.video_id,
                "ws": watched_seconds,
                "ts": total_seconds,
                "pp": progress_percent,
                "cat": log.created_at
            })
            
            migrated_count += 1
            if migrated_count % 10 == 0:
                print(f"   ... migrated {migrated_count} logs")
        
        await session.commit()
        print(f"✅ Migration Complete! {migrated_count} new logs created.")
        print("🎉 이제 user_youtube_logs 테이블에 풍부한 가짜 데이터가 채워졌습니다.")

if __name__ == "__main__":
    # Windows에서 asyncio 실행 정책 설정 (필요 시)
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        
    asyncio.run(migrate_logs())
