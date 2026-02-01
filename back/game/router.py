from fastapi import APIRouter, Depends
from typing import Annotated
from user.router import get_current_user
from user.models import User

router = APIRouter(prefix="/api/game", tags=["Game"])

@router.get("/status")
async def get_game_status(current_user: Annotated[User, Depends(get_current_user)]):
    """
    게임 서버 상태 확인 및 유저 접속 확인
    """
    return {
        "status": "online",
        "user": current_user["nickname"],
        "message": "Welcome to the RPG World"
    }
