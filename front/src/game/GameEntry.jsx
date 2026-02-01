import React, { useState, useEffect } from 'react';
import { Joystick } from 'react-joystick-component';
import GameCanvas from './core/GameCanvas';
import BuildingModal from './ui/BuildingModal';
import userApi from '../api/user';
import { useGameInput } from './core/useGameInput';

const GameEntry = () => {
  const [activeModal, setActiveModal] = useState(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const { input, handleJoystickMove } = useGameInput(); // 입력 훅 (WASD + 조이스틱)

  // 접속자 수 폴링 (5초마다 갱신)
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

  const handleBuildingClick = (buildingName) => {
    setActiveModal(buildingName);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      position: 'relative',
      background: '#0a0a0a'
    }}>

      {/* 메인 게임 캔버스 (입력 상태 전달) */}
      <GameCanvas onBuildingClick={handleBuildingClick} input={input} />

      {/* 상단 HUD - 타이틀 & 접속자 수 & 설정 */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        right: 10,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        pointerEvents: 'none',
        zIndex: 100
      }}>
        {/* 왼쪽 정보창 */}
        <div style={{ display: 'flex', gap: '8px', pointerEvents: 'auto' }}>
          <div style={{
            color: 'white',
            textShadow: '1px 1px 3px black',
            fontSize: '14px',
            background: 'rgba(0,0,0,0.5)',
            padding: '6px 12px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>🏘️ 소개팅 마을</span>
          </div>

          <div style={{
            color: '#4ade80',
            textShadow: '1px 1px 3px black',
            fontSize: '13px',
            background: 'rgba(0,0,0,0.5)',
            padding: '6px 12px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span style={{ width: '8px', height: '8px', background: '#4ade80', borderRadius: '50%' }}></span>
            {onlineCount.toLocaleString()}명 접속 중
          </div>
        </div>

        {/* 오른쪽 설정 버튼 */}
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
            pointerEvents: 'auto',
            boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
          }}
          onClick={() => {
            if (window.confirm('로그아웃 하시겠습니까?')) {
              window.location.href = '/login';
            }
          }}
        >
          ⚙️
        </button>
      </div>

      {/* 조이스틱 UI (왼쪽 하단) - 모바일/PC 모두 표시 (선택사항) */}
      <div style={{
        position: 'absolute',
        bottom: 50,
        left: 30,
        zIndex: 90,
        opacity: 0.6 // 게임 화면 가리지 않게 살짝 투명
      }}>
        <Joystick
          size={100}
          sticky={false}
          baseColor="rgba(255, 255, 255, 0.2)"
          stickColor="rgba(255, 255, 255, 0.5)"
          move={handleJoystickMove}
          stop={handleJoystickMove}
        />
      </div>

      {/* 하단 안내 메시지 */}
      <div style={{
        position: 'absolute',
        bottom: 20,
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
          WASD 키 또는 조이스틱으로 이동하세요
        </div>
      </div>

      {/* 모달 시스템 */}
      {activeModal && (
        <BuildingModal
          buildingName={activeModal}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default GameEntry;
