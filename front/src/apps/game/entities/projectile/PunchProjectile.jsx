import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';

// [도 -> 라디안 변환기]
const circulate = (deg) => deg * (Math.PI / 180);

export const PunchProjectile = ({
  id, startPos, playerRot, onFinish, onUpdate, onAdd,
  generation = 0, side, velocity, baseAng
}) => {
  const spriteRef = useRef();
  const tick = useRef(0);
  const pos = useRef({ ...startPos });
  const vel = useRef(velocity);
  const isSplit = useRef(false);
  const texture = useTexture('/golden_punch.png');

  const MAX_GEN = 4; // 2^4 = 16발까지 증식
  const speed = 2.5;

  useEffect(() => { if (velocity) vel.current = velocity; }, [velocity]);

  useFrame((_, delta) => {
    if (!spriteRef.current) return;
    tick.current += delta;

    // 0. 초기 속도 세팅 (side에 따라 왼쪽/오른쪽 자동 결정)
    if (!vel.current) {
      const sideDeg = side === 'left' ? 90 : -90;
      const ang = playerRot + circulate(sideDeg);
      vel.current = { x: Math.sin(ang) * speed, z: Math.cos(ang) * speed };
    }

    // 1. 이동
    pos.current.x += vel.current.x * delta;
    pos.current.z += vel.current.z * delta;
    spriteRef.current.position.set(pos.current.x, 1.5, pos.current.z);

    // 2. 방향 회전
    const moveAng = Math.atan2(vel.current.x, vel.current.z);
    spriteRef.current.material.rotation = -moveAng + Math.PI;

    // ==========================================================
    // [★ 프랙탈 분열 로직 (1 -> 2 -> 4 -> 8 -> 16)] 
    // ==========================================================
    if (tick.current > 1.0 && !isSplit.current && generation < MAX_GEN) {
      isSplit.current = true;
      onFinish?.(id); // 현재 세대는 자식을 낳고 사라짐

      // 기준 각도 계승 (처음 분열할 때의 각도를 가문의 비기로 물려줌)
      const pivot = baseAng || Math.atan2(vel.current.x, vel.current.z);

      // [자식 A: 기준선 대비 위로 45도]
      onAdd?.({
        startPos: { ...pos.current },
        velocity: { x: Math.sin(pivot + circulate(45)) * speed, z: Math.cos(pivot + circulate(45)) * speed },
        generation: generation + 1,
        baseAng: pivot,
        side
      });

      // [자식 B: 기준선 대비 아래로 45도]
      onAdd?.({
        startPos: { ...pos.current },
        velocity: { x: Math.sin(pivot - circulate(45)) * speed, z: Math.cos(pivot - circulate(45)) * speed },
        generation: generation + 1,
        baseAng: pivot,
        side
      });
    }

    // 모든 펀치는 1초 뒤에 사라집니다 (마지막 16발 포함)
    if (tick.current > 1.0) onFinish?.(id);
  });

  return (
    <sprite ref={spriteRef} scale={[1.5, 1.5, 1]}>
      <spriteMaterial map={texture} transparent={true} />
    </sprite>
  );
};
