from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# 나중에 .env 파일 쓰실 때를 대비해 확장성 있게 짜둡니다.
# (지금은 기본값으로 바로 붙습니다)
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "0000")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "aisogething")

SQLALCHEMY_DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# 엔진 생성
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# 세션 생성기
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base 선언
Base = declarative_base()

# 의존성 함수
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==========================================================
# [중요] 모든 모델 Import (Circular Import 방지를 위해 맨 아래에!)
# ==========================================================
# Alembic이 이 파일을 import 하면, 아래 코드들도 실행되면서 
# Base.metadata에 테이블 정보가 싹 다 등록됩니다.

from user.models import User
from youtube.models import Comment, UserLog, YoutubeList
