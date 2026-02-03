import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export const usePlayerMovement = (ref, input, onMove) => {
  const lastSendTime = useRef(0);

  useFrame((state) => {
    if (!ref.current) return;

    if (input.isMoving) {
      // 입력 소스에 따른 속도 조절 (키보드는 정밀 조작을 위해 조금 느리게)
      const moveSpeed = input.source === 'keyboard' ? 0.15 : 5.0;

      ref.current.position.x += input.x * moveSpeed;
      ref.current.position.z += input.y * moveSpeed;
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
};
