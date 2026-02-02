import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';

const RemotePlayer = ({ position, rotation, animation, nickname }) => {
  const meshRef = useRef();

  // 부드러운 움직임 보간 (Interpolation)
  useFrame(() => {
    if (meshRef.current) {
      // 현재 위치에서 목표 위치로 10%씩 이동 (Lerp)
      meshRef.current.position.x += (position.x - meshRef.current.position.x) * 0.1;
      meshRef.current.position.z += (position.z - meshRef.current.position.z) * 0.1;

      // 회전도 부드럽게
      //   meshRef.current.rotation.y = rotation; // 회전은 일단 직관적으로 적용
    }
  });

  return (
    <group ref={meshRef} position={[position.x || 0, 1, position.z || 0]}>
      {/* 캐릭터 몸체 (플레이어와 동일한 원통형) */}
      <mesh castShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 1, 16]} />
        <meshStandardMaterial color="#ff6b6b" />
      </mesh>

      {/* 머리/장식 (방향 확인용) */}
      <mesh position={[0, 0.3, 0.4]}>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshStandardMaterial color="white" />
      </mesh>

      {/* 닉네임 표시 */}
      {/* 닉네임 표시 */}
      <Html position={[0, 2.5, 0]} center>
        <div style={{
          background: 'rgba(0, 0, 0, 0.6)',
          color: 'white',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          whiteSpace: 'nowrap'
        }}>
          {nickname}
        </div>
      </Html>
    </group>
  );
};

export default RemotePlayer;
