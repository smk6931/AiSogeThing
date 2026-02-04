import { getWebSocketUrl } from '@api/client';

/**
 * 게임 관련 실시간 및 데이터 API
 */
const gameApi = {
  /**
   * 게임 웹소켓 연결 생성
   */
  createSocket: (userId, nickname) => {
    const wsUrl = getWebSocketUrl(`/api/game/ws/${userId}/${nickname}`);
    return new WebSocket(wsUrl);
  },

  /**
   * 위치 데이터 전송 포맷팅
   */
  sendPosition: (socket, positionData) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(positionData));
    }
  },

  /**
   * 채팅 데이터 전송 포맷팅
   */
  sendChat: (socket, message) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const payload = {
        event: 'chat',
        message: message,
        timestamp: new Date().toISOString()
      };
      socket.send(JSON.stringify(payload));
    }
  }
};

export default gameApi;
