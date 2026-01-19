from user.schemas import UserCreate
from user.auth import get_password_hash
from core.database import execute, fetch_one, fetch_all, insert_and_return  # Raw SQL 래퍼 사용
from datetime import datetime, timedelta

# ========================================================
#  User 서비스 (Raw SQL 버전)
# ========================================================

async def get_user_by_email(email: str):
    """이메일로 사용자 조회 (Async Raw SQL)"""
    sql = 'SELECT * FROM "user" WHERE email = :email'
    return await fetch_one(sql, {"email": email})

async def create_user(user: UserCreate):
    """신규 회원 생성 (Async Raw SQL)"""
    # 1. 비밀번호 암호화
    hashed_password = get_password_hash(user.password)
    
    # 2. INSERT 쿼리
    sql = """
        INSERT INTO "user" (email, hashed_password, nickname, is_active, is_superuser, created_at)
        VALUES (:email, :password, :nickname, true, false, NOW())
        RETURNING id, email, nickname, is_active, created_at
    """
    
    params = {
        "email": user.email,
        "password": hashed_password,
        "nickname": user.nickname
    }
    
    # 3. 실행 및 결과 반환
    return await insert_and_return(sql, params)

async def update_last_active(user_id: int):
    """유저 마지막 활동 시간 갱신 (Heartbeat)"""
    sql = """
        UPDATE "user"
        SET last_active_at = NOW()
        WHERE id = :user_id
    """
    await execute(sql, {"user_id": user_id})

async def count_online_users(minutes: int = 5):
    """
    최근 N분 내 활동 유저 수 조회
    """
    # Python에서 시간 계산 (DB 종속성 제거 및 안전성 확보)
    limit_time = datetime.now() - timedelta(minutes=minutes)
    
    sql = """
        SELECT COUNT(*) as count 
        FROM "user" 
        WHERE last_active_at >= :limit_time
          AND is_active = true
    """
    
    result = await fetch_one(sql, {"limit_time": limit_time})
    return result["count"] if result else 0

async def get_online_users_list(minutes: int = 5):
    """
    최근 N분 내 활동 유저 목록 조회 (닉네임, 이메일 등)
    """
    limit_time = datetime.now() - timedelta(minutes=minutes)
    
    sql = """
        SELECT id, nickname, email, last_active_at
        FROM "user" 
        WHERE last_active_at >= :limit_time
          AND is_active = true
        ORDER BY last_active_at DESC
        LIMIT 50
    """
    # 너무 많으면 UI 터지니까 일단 50명 제한
    
    return await fetch_all(sql, {"limit_time": limit_time})
