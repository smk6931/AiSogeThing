import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';

// [도 -> 라디안 변환기] 90 넣으면 1.57이 나옵니다.
const circulate = (deg) => deg * (Math.PI / 180);

export const PunchProjectile = ({
  id, startPos, playerRot, onFinish, onUpdate, onAdd,
  generation = 0, side, velocity
}) => {
  const spriteRef = useRef();
  const tick = useRef(0); // [언리얼 스타일] 누적 시간(초)
  const pos = useRef({ ...startPos });
  const vel = useRef(velocity);
  const texture = useTexture('/golden_punch.png');

  const speed = 2.5; // 속도

  // 부모나 외부에서 속도가 바뀌면 내 속도에 반영
  useEffect(() => { if (velocity) vel.current = velocity; }, [velocity]);

  useFrame((_, delta) => {
    if (!spriteRef.current) return;
    tick.current += delta; // 프레임마다 시간 누적

    // 0. 초기 속도 세팅 (방향 * 속도)
    if (!vel.current) {
      const ang = playerRot + circulate(90); // 초기에 90도 (왼쪽)로 발사
      vel.current = {
        x: Math.sin(ang) * speed,
        z: Math.cos(ang) * speed
      };
    }

    // 1. 이동
    pos.current.x += vel.current.x * delta;
    pos.current.z += vel.current.z * delta;
    spriteRef.current.position.set(pos.current.x, 1.5, pos.current.z);

    // 2. 방향 회전
    const moveAng = Math.atan2(vel.current.x, vel.current.z);
    spriteRef.current.material.rotation = -moveAng + Math.PI;

    // ==========================================================
    // [★ 1->2->4 기하급수 분열 로직] (매 1.0초마다 실행)
    // ==========================================================
    if (tick.current > 1.0 && generation < 2) {
      tick.current = 0; // 타이머 리셋 (다음 1초를 위해)

      const currentAng = Math.atan2(vel.current.x, vel.current.z);

      // [본체 변경] 현재 방향에서 +45도 회전
      const myNewAng = currentAng + circulate(45);
      const myNewVel = { x: Math.sin(myNewAng) * speed, z: Math.cos(myNewAng) * speed };
      vel.current = myNewVel;
      onUpdate?.(id, { velocity: myNewVel, generation: generation + 1 });

      // [분신 생성] 현재 방향에서 -45도 꺾어서 새로 소환
      const friendAng = currentAng - circulate(45);
      onAdd?.({
        startPos: { ...pos.current },
        velocity: { x: Math.sin(friendAng) * speed, z: Math.cos(friendAng) * speed },
        generation: generation + 1,
        side
      });
    }
    // ==========================================================

    if (tick.current > 10.0) onFinish?.(id);
  });

  return (
    <sprite ref={spriteRef} scale={[1.5, 1.5, 1]}>
      <spriteMaterial map={texture} transparent={true} />
    </sprite>
  );
};
