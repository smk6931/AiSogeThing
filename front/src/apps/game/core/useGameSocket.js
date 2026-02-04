import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@shared/context/AuthContext';
import gameApi from '@api/game/game';

export const useGameSocket = () => {
    const { user } = useAuth();
    const socketRef = useRef(null);
    const [otherPlayers, setOtherPlayers] = useState({});
    const [chatMessages, setChatMessages] = useState([]);
    const [latestChatMap, setLatestChatMap] = useState({});

    useEffect(() => {
        if (!user) return;

        // API 레이어를 통해 소켓 생성
        const socket = gameApi.createSocket(user.id, user.nickname);
        socketRef.current = socket;

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if (message.event === 'player_move') {
                if (String(message.user_id) === String(user.id)) return;
                setOtherPlayers(prev => ({
                    ...prev,
                    [message.user_id]: {
                        ...prev[message.user_id],
                        ...message.position,
                        nickname: message.nickname
                    }
                }));
            } else if (message.event === 'player_left') {
                setOtherPlayers(prev => {
                    const newPlayers = { ...prev };
                    delete newPlayers[message.user_id];
                    return newPlayers;
                });
            } else if (message.event === 'chat') {
                setChatMessages(prev => {
                    const newMessages = [...prev, message];
                    if (newMessages.length > 50) return newMessages.slice(-50);
                    return newMessages;
                });

                setLatestChatMap(prev => ({
                    ...prev,
                    [message.user_id]: {
                        message: message.message,
                        timestamp: message.timestamp
                    }
                }));
            }
        };

        socket.onopen = () => console.log('Game Socket Connected! 🟢');
        socket.onclose = () => console.log('Game Socket Disconnected 🔴');
        socket.onerror = (err) => console.error('Game Socket Error:', err);

        return () => socket.close();
    }, [user]);

    // 전송 로직도 API 레이어에 위임
    const sendPosition = (positionData) => {
        gameApi.sendPosition(socketRef.current, positionData);
    };

    const sendChatMessage = (text) => {
        gameApi.sendChat(socketRef.current, text);
    };

    return { otherPlayers, sendPosition, chatMessages, sendChatMessage, latestChatMap };
};
