import React, { useState, useEffect } from 'react';
import { Joystick } from 'react-joystick-component';
import GameCanvas from './core/GameCanvas';
import BuildingModal from './ui/BuildingModal';
import GameBottomNav from './ui/GameBottomNav';
import userApi from '../api/user';
import { useGameInput } from './core/useGameInput';

// 앱 모드에서 보여줄 페이지 컴포넌트들 매핑
import YoutubeBoard from '../pages/Youtube/YoutubeBoardNew';
import Chat from '../pages/Chat/Chat';
import HotPlace from '../pages/HotPlace/HotPlace';
import NovelList from '../pages/Novel/NovelList';
import Community from '../pages/Community/Community';
import Matching from '../pages/Matching/Matching';

const GameEntry = () => {
  const [activeModal, setActiveModal] = useState(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [isAppMode, setIsAppMode] = useState(false); // true: 앱 모드, false: 게임 모드

  const { input, handleJoystickMove } = useGameInput();

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

  const handleBuildingClick = (buildingName) => {
    // '마을' 버튼(null)을 누르면 무조건 게임 모드로 돌아가면서 모달 닫기
    if (buildingName === null) {
      setActiveModal(null);
      setIsAppMode(false);
      return;
    }
    setActiveModal(buildingName);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const toggleMode = () => {
    const newMode = !isAppMode;
    setIsAppMode(newMode);

    // 앱 모드로 갈 때, 선택된 기능이 없으면 '커뮤니티'를 기본으로 띄움
    if (newMode && !activeModal) {
      setActiveModal('구청 (커뮤니티/피드)');
    }
  };

  // 앱 모드 컨텐츠 렌더링
  const renderAppContent = () => {
    switch (activeModal) {
      case '영화관 (YouTube)': return <YoutubeBoard />;
      case '우체국 (채팅)': return <Chat />;
      case '안내소 (지도/데이트코스)': return <HotPlace />;
      case '도서관 (웹툰/소설)': return <NovelList />;
      case '구청 (커뮤니티/피드)': return <Community />;
      case '카페 (매칭)': return <Matching />;
      default: return <Community />; // 기본값
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      position: 'relative',
      background: '#0a0a0a',
      color: 'white'
    }}>

      {/* 스크롤바 숨김 스타일 */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ================= 게임 모드 영역 ================= */}
      <div style={{
        width: '100%',
        height: '100%',
        // 앱 모드일 때는 화면 밖으로 숨김 (상태 유지를 위해 unmount 하지 않음)
        position: 'absolute',
        top: 0,
        visibility: isAppMode ? 'hidden' : 'visible'
      }}>
        <GameCanvas onBuildingClick={handleBuildingClick} input={input} active={!isAppMode} />
      </div>

      {/* 게임 모드 전용 UI (조이스틱, 안내문구) */}
      {!isAppMode && (
        <>
          <div style={{
            position: 'absolute',
            bottom: 50,
            left: 30,
            zIndex: 90,
            opacity: 0.8
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
        </>
      )}


      {/* ================= 앱 모드 영역 ================= */}
      {isAppMode && (
        <div
          className="no-scrollbar"
          style={{
            position: 'absolute',
            top: 60, // 상단 헤더 공간 확보
            bottom: 70, // 하단 네비 공간 확보
            left: 0,
            right: 0,
            overflowY: 'auto',
            background: '#111',
            zIndex: 50,
            padding: '0 20px' // 좌우 여백 추가
          }}>
          <div style={{ paddingTop: '10px', paddingBottom: '20px' }}>
            {renderAppContent()}
          </div>
        </div>
      )}


      {/* ================= 공통 상단 HUD (항상 표시) ================= */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 15px',
        background: isAppMode ? '#1a1a1a' : 'transparent', // 앱 모드일 땐 배경색 있음
        zIndex: 100,
        transition: 'background 0.3s'
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{
            fontSize: '16px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'white',
            textShadow: isAppMode ? 'none' : '1px 1px 3px black',
          }}>
            <span>{isAppMode ? activeModal?.split(' ')[0] || '커뮤니티' : '🏘️ 소개팅 마을'}</span>
          </div>

          <div style={{
            color: '#4ade80',
            backgroundColor: isAppMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.5)',
            fontSize: '12px',
            padding: '4px 8px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backdropFilter: 'blur(4px)'
          }}>
            <span style={{ width: '6px', height: '6px', background: '#4ade80', borderRadius: '50%' }}></span>
            {onlineCount}명
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {/* 모드 전환 버튼 */}
          <button
            onClick={toggleMode}
            style={{
              background: isAppMode ? '#6366f1' : 'rgba(255, 255, 255, 0.2)',
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
            {isAppMode ? '🎮 게임 모드' : '📱 앱 모드'}
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
              if (window.confirm('로그아웃 하시겠습니까?')) {
                window.location.href = '/login';
              }
            }}
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* ================= 앱 모드 하단 네비게이션 ================= */}
      {isAppMode && (
        <GameBottomNav activeModal={activeModal} onNavigate={handleBuildingClick} />
      )}

      {/* ================= 게임 모드 모달 (팝업 형태) ================= */}
      {/* 게임 모드일 때만 모달이 뜸. 앱 모드일 땐 메인 화면으로 대체됨 */}
      {!isAppMode && activeModal && (
        <BuildingModal
          buildingName={activeModal}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default GameEntry;
