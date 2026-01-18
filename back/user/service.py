from user.schemas import UserCreate
from user.auth import get_password_hash
from core.database import execute, fetch_one  # Raw SQL 래퍼 사용

# ========================================================
#  User 서비스 (Raw SQL 버전)
# ========================================================

def get_user_by_email(email: str):
    """이메일로 사용자 조회 (Raw SQL)"""
    sql = "SELECT * FROM public.user WHERE email = :email"
    return fetch_one(sql, {"email": email})

def create_user(user: UserCreate):
    """신규 회원 생성 (Raw SQL)"""
    # 1. 비밀번호 암호화
    hashed_password = get_password_hash(user.password)
    
    # 2. INSERT 쿼리 (RETURNING으로 생성된 ID 반환)
    sql = """
        INSERT INTO public.user (email, hashed_password, nickname, is_active, is_superuser, created_at)
        VALUES (:email, :password, :nickname, true, false, NOW())
        RETURNING id, email, nickname, is_active, created_at
    """
    
    params = {
        "email": user.email,
        "password": hashed_password,
        "nickname": user.nickname
    }
    
    # 3. 실행 및 결과 반환
    # execute 함수가 내부적으로 commit 처리함
    return fetch_one(sql, params)  # INSERT 후 RETURNING 값을 받기 위해 fetch_one 사용
