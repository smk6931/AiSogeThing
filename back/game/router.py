from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from typing import Annotated, List, Dict
import json

router = APIRouter(prefix="/api/game", tags=["Game"])

from .service import game_service

@router.get("/status")
async def get_game_status():
    return {"status": "online", "active_players": game_service.get_online_count()}

@router.websocket("/ws/{user_id}/{nickname}")
async def websocket_endpoint(websocket: WebSocket, user_id: str, nickname: str):
    # 1. 연결 수짐 (Service에 위임)
    await game_service.connect(websocket, user_id, nickname)

    try:
        while True:
            data = await websocket.receive_json()
            
            # 2. 메시지 처리 (Service에 위임)
            await game_service.handle_message(user_id, nickname, data)
            
    except WebSocketDisconnect:
        # 3. 연결 종료 (Service에 위임)
        await game_service.disconnect(websocket, user_id)

