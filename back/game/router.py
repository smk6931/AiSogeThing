from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from typing import Annotated, List, Dict
import json
from utils.socket_manager import ConnectionManager

router = APIRouter(prefix="/api/game", tags=["Game"])

# === Game Scoket Manager (Inherits from Generic Manager) ===
class GameSocketManager(ConnectionManager):
    def __init__(self):
        super().__init__()
        # 게임 전용 데이터: 플레이어 위치
        self.player_positions: Dict[str, dict] = {}

    async def connect(self, websocket: WebSocket, user_id: str, nickname: str):
        # 부모 클래스의 기본 connect 호출 (accept & list append)
        await super().connect(websocket)
        
        # 게임 전용 로직: 초기 위치 설정
        self.player_positions[user_id] = {"x": 0, "z": 0, "nickname": nickname}
        print(f"Game Player connected: {nickname} ({user_id})")
        
        # 접속 알림
        await self.broadcast({"event": "player_joined", "user_id": user_id, "nickname": nickname})

    def disconnect(self, websocket: WebSocket, user_id: str):
        # 부모 클래스 disconnect
        super().disconnect(websocket)
        
        # 게임 전용 로직: 위치 데이터 삭제
        if user_id in self.player_positions:
            del self.player_positions[user_id]
        print(f"Game Player disconnected: {user_id}")

    # broadcast는 부모 클래스 그대로 사용

manager = GameSocketManager()

@router.get("/status")
async def get_game_status():
    return {"status": "online", "active_players": len(manager.active_connections)}

@router.websocket("/ws/{user_id}/{nickname}")
async def websocket_endpoint(websocket: WebSocket, user_id: str, nickname: str):
    await manager.connect(websocket, user_id, nickname)
    try:
        while True:
            data = await websocket.receive_json()
            
            if user_id in manager.player_positions:
                manager.player_positions[user_id].update(data)
                
            payload = {
                "event": "player_move",
                "user_id": user_id,
                "nickname": nickname,
                "position": data
            }
            await manager.broadcast(payload)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
        await manager.broadcast({"event": "player_left", "user_id": user_id})

