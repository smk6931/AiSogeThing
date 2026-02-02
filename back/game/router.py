from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from typing import Annotated, List, Dict
import json

router = APIRouter(prefix="/api/game", tags=["Game"])

from utils.websocket import ConnectionManager

manager = ConnectionManager()
# player_positions: { user_id: {x, z, nickname} }
player_positions: Dict[str, dict] = {}

@router.get("/status")
async def get_game_status():
    return {"status": "online", "active_players": len(manager.active_connections)}

@router.websocket("/ws/{user_id}/{nickname}")
async def websocket_endpoint(websocket: WebSocket, user_id: str, nickname: str):
    # 1. 연결 수락 및 리스트 추가
    await manager.connect(websocket)
    
    # 2. 게임 플레이어 등록
    player_positions[user_id] = {"x": 0, "z": 0, "nickname": nickname}
    print(f"Game Player connected: {nickname} ({user_id})")
    
    # 3. 접속 알림 전송
    await manager.broadcast({"event": "player_joined", "user_id": user_id, "nickname": nickname})

    try:
        while True:
            data = await websocket.receive_json()
            
            # 위치 데이터 업데이트
            if user_id in player_positions:
                player_positions[user_id].update(data)
                
            # 이동 정보 브로드캐스트
            payload = {
                "event": "player_move",
                "user_id": user_id,
                "nickname": nickname,
                "position": data
            }
            await manager.broadcast(payload)
            
    except WebSocketDisconnect:
        # 4. 연결 종료 및 데이터 정리
        manager.disconnect(websocket)
        
        if user_id in player_positions:
            del player_positions[user_id]
            
        print(f"Game Player disconnected: {user_id}")
        await manager.broadcast({"event": "player_left", "user_id": user_id})

