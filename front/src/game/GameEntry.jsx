import React, { useState, useEffect } from 'react';
import GameCanvas from './core/GameCanvas';

const GameEntry = () => {
  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);

  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>

      {/* (1) 가로 모드 유도 오버레이 */}
      {isPortrait && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.9)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          textAlign: 'center',
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔄</div>
          <h2>가로 화면으로 돌려주세요</h2>
          <p style={{ opacity: 0.8, marginTop: '10px' }}>RPG 월드는 가로 모드에 최적화되어 있습니다.</p>
        </div>
      )}

      {/* (2) 게임 캔버스 */}
      <GameCanvas />

      {/* (3) UI 레이어 (Canvas 위에 띄울 HTML) - 가로일 때만 활성화 권장 */}
      {!isPortrait && (
        <>
          <div style={{
            position: 'absolute',
            top: 20,
            left: 20,
            color: 'white',
            textShadow: '1px 1px 2px black',
            pointerEvents: 'none'
          }}>
            <h1>RPG World</h1>
            <p>Welcome to the metaverse</p>
          </div>

          <div style={{
            position: 'absolute',
            top: 20,
            right: 20,
            pointerEvents: 'auto'
          }}>
            <button
              onClick={() => window.history.back()}
              style={{
                padding: '8px 16px',
                background: 'rgba(255, 0, 0, 0.5)',
                color: 'white',
                border: '1px solid white',
                borderRadius: '20px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              EXIT
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default GameEntry;
