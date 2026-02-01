import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import client, { getWebSocketUrl } from '../../api/client';

export const useGameSocket = () => {
    const { user } = useAuth();
    const socketRef = useRef(null);
    const [otherPlayers, setOtherPlayers] = useState({}); // { userId: { x, z, rotation... } }

    useEffect(() => {
        if (!user) return;

        // WebSocket URL 생성 (중앙 관리 함수 사용)
        const wsUrl = getWebSocketUrl(`/api/game/ws/${user.id}/${user.nickname}`);

        console.log('Connecting to Game Socket:', wsUrl);

        socketRef.current = new WebSocket(wsUrl);

        // 메시지 수신 핸들러
        socketRef.current.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if (message.event === 'player_move') {
                // 나 자신의 움직임은 제외
                if (message.user_id === user.id) return;

                setOtherPlayers(prev => ({
                    ...prev,
                    [message.user_id]: {
                        ...prev[message.user_id],
                        ...message.position,
                        nickname: message.nickname
                    }
                }));
            } else if (message.event === 'player_left') {
                // 나간 플레이어 삭제
                setOtherPlayers(prev => {
                    const newPlayers = { ...prev };
                    delete newPlayers[message.user_id];
                    return newPlayers;
                });
            } else if (message.event === 'player_joined') {
                console.log(`User joined: ${message.nickname}`);
            }
        };

        socketRef.current.onopen = () => {
            console.log('Game Socket Connected! 🟢');
        };

        socketRef.current.onclose = (event) => {
            console.log('Game Socket Disconnected 🔴', event.code, event.reason);
        };

        socketRef.current.onerror = (error) => {
            console.error('Game Socket Error:', error);
        };

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, [user]);

    // 내 위치 전송 함수
    const sendPosition = (positionData) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify(positionData));
        }
    };

    return { otherPlayers, sendPosition };
};
