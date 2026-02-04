import React, { useState, useEffect } from 'react';
import { Joystick } from 'react-joystick-component';
import GameCanvas from './core/GameCanvas';
import userApi from '../../shared/api/user';
import { useGameInput } from './core/useGameInput';
import { useGameSocket } from './core/useGameSocket';
import GameOverlay from './ui/GameOverlay';
import ChatBox from './ui/ChatBox';

const GameEntry = () => {
  const [onlineCount, setOnlineCount] = useState(0);
  const { input, actions, handleJoystickMove, skillInput, handleSkillMove, handleSkillStop, simulateKey } = useGameInput();
  const { otherPlayers, sendPosition, chatMessages, sendChatMessage, latestChatMap } = useGameSocket();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // 화면 크기 감지
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 접속자 수 폴링
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await userApi.getOnlineStats();
        setOnlineCount(response.data.online_users);
      } catch (error) {
        console.error('Status Error:', error);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const goBackToHome = () => {
    window.location.href = '/';
  };

  return (
    <div style={{
      position: 'fixed', // 화면 고정 (스크롤/밀림 방지)
      inset: 0,
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      background: '#0a0a0a',
      color: 'white',
      touchAction: 'none' // 터치 제스처 방지
    }}>

      {/* ================= 3D Game World ================= */}
      <div style={{ width: '100%', height: '100%' }}>
        <GameCanvas
          input={input}
          active={true}
          otherPlayers={otherPlayers}
          sendPosition={sendPosition}

          latestChatMap={latestChatMap}
          inputActions={actions}
        />
      </div>

      {/* ================= Game UI Overlay (HP, Skill, Minimap) ================= */}
      <GameOverlay onSimulateKey={simulateKey} hideMobileButton={true} />

      {/* ================= Chat Box ================= */}
      <ChatBox messages={chatMessages} onSend={sendChatMessage} isMobile={isMobile} />

      {/* ================= Joystick ================= */}
      <div style={{
        position: 'absolute',
        bottom: 30, // 더 아래로 내림
        left: 20,   // 더 왼쪽으로 붙임
        zIndex: 90,
        opacity: 0.8
      }}>
        <Joystick
          size={80}
          sticky={false}
          baseColor="rgba(255, 255, 255, 0.2)"
          stickColor="rgba(255, 255, 255, 0.5)"
          move={handleJoystickMove}
          stop={handleJoystickMove}
        />
      </div>

      {/* ================= Right Joystick (Skill) ================= */}
      <div style={{
        position: 'absolute',
        bottom: 30,
        right: 20,
        zIndex: 90,
        opacity: 0.8
      }}>
        <Joystick
          size={80}
          sticky={false}
          baseColor="rgba(255, 0, 0, 0.2)"
          stickColor="rgba(255, 0, 0, 0.5)"
          move={handleSkillMove}
          stop={handleSkillStop}
        />
      </div>

      {/* ================= Game Info (Bottom Center) ================= */}
      <div style={{
        position: 'absolute',
        bottom: 25,
        left: 0,
        right: 0,
        textAlign: 'center',
        pointerEvents: 'none',
        zIndex: 80
      }}>
        <div style={{
          color: 'white',
          textShadow: '1px 1px 2px black',
          fontSize: '12px',
          opacity: 0.7
        }}>
          {/* Use WASD keys or joystick to move */}
        </div>
      </div>

      {/* ================= Top HUD ================= */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 'auto',
        minHeight: '60px',
        paddingTop: 'max(10px, env(safe-area-inset-top))', // 노치 대응
        paddingBottom: '10px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start', // 상단 정렬
        paddingLeft: '15px',
        paddingRight: '15px',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)',
        zIndex: 100,
        pointerEvents: 'none' // 클릭 통과 (버튼만 클릭 가능하게)
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', pointerEvents: 'auto' }}>


          <div style={{
            color: '#4ade80',
            backgroundColor: 'rgba(0,0,0,0.5)',
            fontSize: '12px',
            padding: '4px 8px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backdropFilter: 'blur(4px)'
          }}>
            <span style={{ width: '6px', height: '6px', background: '#4ade80', borderRadius: '50%' }}></span>
            {onlineCount} Online
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', pointerEvents: 'auto' }}>
          {/* 홈으로 돌아가기 버튼 */}
          <button
            onClick={goBackToHome}
            style={{
              background: 'rgba(99, 102, 241, 0.8)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '20px',
              padding: '6px 12px',
              color: 'white',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            � 홈으로
          </button>

          {/* 설정 버튼 */}
          <button
            style={{
              background: 'rgba(255, 0, 0, 0.6)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              color: 'white',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => {
              if (window.confirm('Are you sure you want to log out?')) {
                window.location.href = '/login';
              }
            }}
          >
            ⚙️
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameEntry;
