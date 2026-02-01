import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, Stars } from '@react-three/drei';
import RpgWorld from '../world/RpgWorld';

const GameCanvas = ({ onBuildingClick, input }) => {
  return (
    <Canvas
      camera={{
        position: [0, 50, 0], // 완전 위에서 아래로 (Top-down)
        rotation: [-Math.PI / 2, 0, 0], // 카메라를 바닥으로 숙임
        zoom: 20, // 줌 조절
        near: 0.1,
        far: 1000,
        up: [0, 0, -1] // 화면 위쪽이 북쪽(-Z)이 되도록 설정
      }}
      orthographic // 원근감 없는 아이소메트릭 뷰
      shadows
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
        <RpgWorld onBuildingClick={onBuildingClick} input={input} />
      </Suspense>
    </Canvas>
  );
};

export default GameCanvas;
