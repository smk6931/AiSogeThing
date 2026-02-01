import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

const Player = ({ input }) => {
  const meshRef = useRef();
  const speed = 0.15; // 이동 속도

  useFrame(() => {
    if (!meshRef.current) return;

    if (input.isMoving) {
      // 90도 탑다운 뷰: 입력 방향 그대로 이동 (회전 불필요)
      // W(위) -> Z 감소 (북쪽)
      // S(아래) -> Z 증가 (남쪽)
      // A(왼쪽) -> X 감소 (서쪽)
      // D(오른쪽) -> X 증가 (동쪽)

      meshRef.current.position.x += input.x * speed;
      meshRef.current.position.z += input.y * speed; // input.y가 -1(W)일 때 Z 감소

      // 캐릭터 회전 (이동 방향 바라보기)
      // atan2(x, y)는 (0,1)이 0도. 
      // Three.js에서는 -Z가 정면(0도 아님). 보통 +Z가 0도.
      // Top-down에서 atan2(input.x, input.y)로 하면:
      // W누르면 x=0, y=-1 -> atan2(0, -1) = -PI (180도) -> 뒤를 봄?
      // S누르면 x=0, y=1 -> atan2(0, 1) = 0 -> 앞을 봄
      // A누르면 x=-1, y=0 -> atan2(-1, 0) = -PI/2 (-90도) -> 왼쪽?
      // 회전 보정이 필요할 수 있음. 일단 넣어보고 확인.
      meshRef.current.rotation.y = Math.atan2(input.x, input.y);
    }
  });

  return (
    <group ref={meshRef} position={[0, 1, 0]}>
      {/* 몸통 */}
      <mesh castShadow>
        <cylinderGeometry args={[0.5, 0.5, 1, 16]} />
        <meshStandardMaterial color="hotpink" />
      </mesh>

      {/* 머리 (방향 확인용 문양) */}
      <mesh position={[0, 0.3, 0.4]}>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshStandardMaterial color="white" />
      </mesh>

      {/* 이름표 */}
      <Text
        position={[0, 1.2, 0]}
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
};

export default Player;
