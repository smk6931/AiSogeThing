from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import text
import os
from dotenv import load_dotenv

# .env 파일 로드 (프로젝트 루트 또는 back 폴더에서 찾기)
env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')  # back/core/../../.env
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    load_dotenv()  # 현재 디렉토리에서 찾기

# ==========================================================
#  [Async] DB 연결 설정 (SQLAlchemy Async Core)
# ==========================================================

DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "0000")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5433")
DB_NAME = os.getenv("DB_NAME", "aisogething")

# 비동기 드라이버 (postgresql+asyncpg)
SQLALCHEMY_DATABASE_URL = f"postgresql+asyncpg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# 디버깅: 연결 정보 출력 (비밀번호 제외)
print(f"🔌 DB 연결 정보: {DB_USER}@{DB_HOST}:{DB_PORT}/{DB_NAME}")

# Async 엔진 생성
engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    echo=False  # 쿼리 로그 볼거면 True
)

# Base 선언 (마이그레이션용)
Base = declarative_base()


# ==========================================================
#  [핵심] Async Raw SQL 실행 래퍼 함수
# ==========================================================

async def execute(query: str, params: dict = None):
    """
    INSERT, UPDATE, DELETE 쿼리 실행 (비동기)
    """
    try:
        async with engine.begin() as conn:  # 비동기 트랜잭션 (성공 시 자동 Commit)
            result = await conn.execute(text(query), params or {})
            return result
    except Exception as e:
        print(f"❌ execute 실패: {e}")
        raise e

async def fetch_one(query: str, params: dict = None) -> dict | None:
    """
    SELECT 단건 조회 (비동기, Dict 반환)
    """
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text(query), params or {})
            row = result.mappings().first()
            return dict(row) if row else None
    except Exception as e:
        print(f"❌ fetch_one 실패: {e}")
        raise e

async def fetch_all(query: str, params: dict = None) -> list[dict]:
    """
    SELECT 다건 조회 (비동기, List[Dict] 반환)
    """
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text(query), params or {})
            rows = result.mappings().all()
            return [dict(row) for row in rows]
    except Exception as e:
        print(f"❌ fetch_all 실패: {e}")
        raise e

async def insert_and_return(query: str, params: dict = None) -> dict | None:
    """
    INSERT/UPDATE 후 결과 반환 (비동기, Transaction Commit 포함)
    """
    try:
        async with engine.begin() as conn:
            result = await conn.execute(text(query), params or {})
            row = result.mappings().first()
            return dict(row) if row else None
    except Exception as e:
        print(f"❌ insert_and_return 실패: {e}")
        raise e

# ==========================================================
#  [Legacy] 의존성 주입용 (비동기 세션으로 변경 필요 시 사용)
# ==========================================================
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# 스크립트에서 사용할 수 있도록 별칭 제공
async_session_factory = AsyncSessionLocal

async def get_db():
    async with AsyncSessionLocal() as db:
        try:
            yield db
        finally:
            await db.close()

# 모델 Import
from user.models import User
from youtube.models import Comment, UserLog, YoutubeList
