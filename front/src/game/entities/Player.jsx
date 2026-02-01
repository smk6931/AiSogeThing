import React, { forwardRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

// forwardRef로 변경하여 부모(RpgWorld)가 플레이어의 위치에 접근할 수 있게 함
const Player = forwardRef(({ input }, ref) => {
  const speed = 0.4; // 속도 더 빠르게 증가 (0.25 -> 0.4)

  useFrame(() => {
    if (!ref.current) return;

    if (input.isMoving) {
      // 45도 회전 제거 -> 직관적인 상하좌우 이동으로 변경
      // 카메라가 정면(혹은 약간 위)에서 바라볼 것이므로 입력 방향 그대로 이동하면 됨

      ref.current.position.x += input.x * speed;
      ref.current.position.z += input.y * speed;

      // 캐릭터 회전 (이동 방향 바라보기)
      ref.current.rotation.y = Math.atan2(input.x, input.y);
    }
  });

  return (
    <group ref={ref} position={[0, 1, 0]}>
      {/* 몸통 */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.5, 1, 16]} />
        <meshStandardMaterial color="#ff6b6b" />
      </mesh>

      {/* 머리/장식 (방향 확인용) */}
      <mesh position={[0, 0.3, 0.4]}>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshStandardMaterial color="white" />
      </mesh>

      {/* 그림자용 바닥 원형 (선택) */}
      <mesh position={[0, -0.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.6, 32]} />
        <meshBasicMaterial color="black" opacity={0.3} transparent />
      </mesh>

      {/* 이름표 */}
      <Text
        position={[0, 1.3, 0]}
        fontSize={0.4}
        color="white"
        anchorX="center"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        Me
      </Text>
    </group>
  );
});

export default Player;
