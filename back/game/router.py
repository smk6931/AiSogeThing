from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from typing import Annotated, List, Dict
import json

router = APIRouter(prefix="/api/game", tags=["Game"])

# === Game Scoket Manager (Self-contained) ===
class GameSocketManager:
    def __init__(self):
        # active_connections: Socket 객체 리스트
        self.active_connections: List[WebSocket] = []
        # player_positions: { user_id: {x, z, nickname} }
        self.player_positions: Dict[str, dict] = {}

    async def connect(self, websocket: WebSocket, user_id: str, nickname: str):
        await websocket.accept()
        self.active_connections.append(websocket)
        
        # 게임 전용 로직: 초기 위치 설정
        self.player_positions[user_id] = {"x": 0, "z": 0, "nickname": nickname}
        print(f"Game Player connected: {nickname} ({user_id})")
        
        # 접속 알림
        await self.broadcast({"event": "player_joined", "user_id": user_id, "nickname": nickname})

    def disconnect(self, websocket: WebSocket, user_id: str):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        
        # 게임 전용 로직: 위치 데이터 삭제
        if user_id in self.player_positions:
            del self.player_positions[user_id]
        print(f"Game Player disconnected: {user_id}")

    async def broadcast(self, message: dict):
        # 모든 접속자에게 메시지 전송
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass # 연결 끊긴 소켓 무시

manager = GameSocketManager()

@router.get("/status")
async def get_game_status():
    return {"status": "online", "active_players": len(manager.active_connections)}

@router.websocket("/ws/{user_id}/{nickname}")
@router.websocket("/game/ws/{user_id}/{nickname}")
@router.websocket("/api/game/ws/{user_id}/{nickname}") # 3중 안전장치 (Nginx 경로 문제 해결)
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

