import React, { forwardRef } from 'react';
import PlayerChat from './player/PlayerChat';
import { usePlayerMovement } from './player/usePlayerMovement';
import { usePlayerSkills } from './player/usePlayerSkills';

const Player = forwardRef(({ input, actions, onMove, onAction, chat }, ref) => {
  // 1. Movement Logic
  usePlayerMovement(ref, input, onMove);

  // 2. Skill Logic
  usePlayerSkills(ref, actions, onAction);

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

      {/* 그림자용 바닥 원형 */}
      <mesh position={[0, -0.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.6, 32]} />
        <meshBasicMaterial color="black" opacity={0.3} transparent />
      </mesh>

      {/* 채팅 UI */}
      <PlayerChat chat={chat} />
    </group>
  );
});

export default Player;
