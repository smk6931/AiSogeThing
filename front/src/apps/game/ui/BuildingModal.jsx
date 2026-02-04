import React from 'react';
import YoutubeBoard from '../../pages/Youtube/YoutubeBoardNew';
import Chat from '../../pages/Chat/Chat';
import HotPlace from '../../pages/HotPlace/HotPlace';
import NovelList from '../../pages/Novel/NovelList';
import Community from '../../pages/Community/Community';
import Matching from '../../pages/Matching/Matching';

import './BuildingModal.css';

const BuildingModal = ({ buildingName, onClose }) => {

  const renderContent = () => {
    switch (buildingName) {
      case '영화관 (YouTube)':
        return <YoutubeBoard />;
      case '우체국 (채팅)':
        return <Chat />;
      case '안내소 (지도/데이트코스)':
        return <HotPlace />;
      case '도서관 (웹툰/소설)':
        return <NovelList />;
      case '구청 (커뮤니티/피드)':
        return <Community />;
      case '카페 (매칭)':
        return <Matching />;
      default:
        return <div>준비 중입니다...</div>;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.8)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      backdropFilter: 'blur(5px)'
    }}>
      {/* 헤더 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px 20px',
        background: '#1a1a1a', // 헤더도 살짝 어둡게
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h3 style={{
          color: 'white',
          margin: 0,
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          {buildingName}
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            color: 'white',
            fontSize: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s'
          }}
        >
          ✕
        </button>
      </div>

      {/* 컨텐츠 영역 (스크롤바 숨김 적용) */}
      <div className="building-modal-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default BuildingModal;
