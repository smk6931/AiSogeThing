from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)   # 이메일 (로그인 ID)
    hashed_password = Column(String, nullable=False)                  # 암호화된 비밀번호
    nickname = Column(String, nullable=True)                          # 닉네임
    is_active = Column(Boolean, default=True)                         # 계정 활성 여부
    is_superuser = Column(Boolean, default=False)                     # 관리자 여부
    created_at = Column(DateTime(timezone=True), server_default=func.now()) # 가입 일시
