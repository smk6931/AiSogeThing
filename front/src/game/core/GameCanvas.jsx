import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, Stars } from '@react-three/drei';
import RpgWorld from '../world/RpgWorld';

const GameCanvas = ({ onBuildingClick, input, active = true, otherPlayers, sendPosition, latestChatMap }) => {
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'} // 앱 모드일 땐 렌더링 중지 (리소스 절약 & 에러 방지)

      camera={{
        position: [0, 30, 20], // 초기 위치 (CameraRig 오프셋과 일치)
        zoom: 16, // 2.5배 더 멀리 (40 -> 16)
        near: 0.1,
        far: 1000
      }}
      orthographic // 원근감 없는 아이소메트릭 뷰
      shadows
      gl={{ preserveDrawingBuffer: false, alpha: false }} // 잔상 원천 차단: 알파 채널 끄고 버퍼 클리어
      onCreated={({ gl }) => gl.setClearColor('#1a1a2e')} // 배경색으로 매 프레임 덮어쓰기
      style={{ width: '100%', height: '100%', background: '#1a1a2e' }}
    >
      {/* 환경 설정 (밤하늘 느낌) */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* 게임 월드 */}
      <Suspense fallback={null}>
        <RpgWorld
          onBuildingClick={onBuildingClick}
          input={input}
          otherPlayers={otherPlayers}
          sendPosition={sendPosition}
          latestChatMap={latestChatMap}
        />
      </Suspense>
    </Canvas>
  );
};

export default GameCanvas;
