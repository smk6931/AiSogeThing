import React, { forwardRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

// forwardRef로 변경하여 부모(RpgWorld)가 플레이어의 위치에 접근할 수 있게 함
const Player = forwardRef(({ input, onMove }, ref) => {
  const speed = 2.0; // 모바일 터치 이동 속도 향상
  const lastSendTime = React.useRef(0);

  useFrame((state) => {
    if (!ref.current) return;

    if (input.isMoving) {
      ref.current.position.x += input.x * speed;
      ref.current.position.z += input.y * speed;
      ref.current.rotation.y = Math.atan2(input.x, input.y);

      // 위치 전송 (0.1초마다)
      const now = state.clock.elapsedTime;
      if (now - lastSendTime.current > 0.1) {
        if (onMove) {
          onMove({
            x: ref.current.position.x,
            z: ref.current.position.z,
            rotation: ref.current.rotation.y
          });
        }
        lastSendTime.current = now;
      }
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
