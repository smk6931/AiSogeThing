import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Stars } from '@react-three/drei';
import RpgWorld from '../world/RpgWorld';

const GameCanvas = () => {
  return (
    <Canvas
      camera={{ position: [0, 5, 10], fov: 50 }}
      shadows
      style={{ width: '100%', height: '100vh', background: '#111' }}
    >
      {/* 기본 환경 설정 */}
      <Sky sunPosition={[100, 20, 100]} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} castShadow />

      {/* 게임 월드 로드 */}
      <Suspense fallback={null}>
        <RpgWorld />
        <OrbitControls makeDefault />
        <gridHelper args={[100, 100]} />
      </Suspense>
    </Canvas>
  );
};

export default GameCanvas;
