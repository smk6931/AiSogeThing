import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

const RpgWorld = () => {
  const meshRef = useRef();

  useFrame((state, delta) => {
    // 큐브 회전 애니메이션 (테스트용)
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group>
      {/* 바닥 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#4a4" />
      </mesh>

      {/* 테스트 큐브 (플레이어 대용) */}
      <mesh ref={meshRef} position={[0, 1, 0]} castShadow>
        <boxGeometry args={[1, 2, 1]} />
        <meshStandardMaterial color="hotpink" />
      </mesh>
    </group>
  );
};

export default RpgWorld;
