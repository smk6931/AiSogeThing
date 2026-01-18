from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from contextlib import contextmanager

# ==========================================================
#  DB 연결 설정 (SQLAlchemy Core + Raw Query Wrapper Strategy)
# ==========================================================

# 1. 환경 변수에서 접속 정보 로드
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "0000")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "aisogething")

SQLALCHEMY_DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# 2. 엔진 생성 (Connection Pool 관리 위임)
# pool_size=5 -> 기본 5개 연결 유지, max_overflow=10 -> 바쁠 때 10개 더 생성
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    pool_size=5, 
    max_overflow=10
)

# 3. Base 선언 (Alembic 마이그레이션용)
Base = declarative_base()


# ==========================================================
#  [핵심] Raw SQL 실행 래퍼 함수 (개발자 편의성 극대화)
# ==========================================================

def execute(query: str, params: dict = None):
    """
    INSERT, UPDATE, DELETE 쿼리 실행 함수
    - 트랜잭션(Commit/Rollback) 자동 처리 (engine.begin)
    - Connection Pool 자동 관리
    """
    try:
        with engine.begin() as conn:  # begin()은 트랜잭션 시작 -> 성공 시 자동 commit
            result = conn.execute(text(query), params or {})
            return result
    except Exception as e:
        print(f"❌ execute 실패: {e}")
        raise e

def fetch_one(query: str, params: dict = None) -> dict | None:
    """
    SELECT 단건 조회 (결과를 딕셔너리로 반환)
    """
    try:
        with engine.connect() as conn:
            result = conn.execute(text(query), params or {})
            row = result.mappings().first()  # 컬럼명:값 형태의 딕셔너리로 변환
            return dict(row) if row else None
    except Exception as e:
        print(f"❌ fetch_one 실패: {e}")
        raise e

def fetch_all(query: str, params: dict = None) -> list[dict]:
    """
    SELECT 다건 조회 (결과 리스트 반환)
    """
    try:
        with engine.connect() as conn:
            result = conn.execute(text(query), params or {})
            rows = result.mappings().all()
            return [dict(row) for row in rows]
    except Exception as e:
        print(f"❌ fetch_all 실패: {e}")
        raise e

# ==========================================================
#  FastAPI 의존성 주입용 (구버전 호환성 유지)
# ==========================================================
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """Alembic이나 구형 코드 호환용 Session Generator"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ==========================================================
#  모델 Import (Alembic 인식용)
# ==========================================================
from user.models import User
from youtube.models import Comment, UserLog, YoutubeList
