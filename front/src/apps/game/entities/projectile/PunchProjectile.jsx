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
  const hasSplit = useRef(false); // [분열 방지용 스위치]
  const hasSplitSecond = useRef(false); // [2초 분열용 스위치]
  const texture = useTexture('/golden_punch.png');

  const speed = 2.5; // 속도

  // 부모나 외부에서 속도가 바뀌면 내 속도에 반영
  useEffect(() => { if (velocity) vel.current = velocity; }, [velocity]);

  useFrame((_, delta) => {
    if (!spriteRef.current) return;
    tick.current += delta; // 프레임마다 시간 누적

    // 0. 초기 속도 세팅 (방향 * 속도)
    if (!vel.current) {
      const ang = playerRot + circulate(90); // 90도 (왼쪽)
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
    // [★ 사용자 로직 구역 - 1초 분열 (1 -> 2발)] 
    // ==========================================================
    if (tick.current > 1.0 && !hasSplit.current && generation === 0) {
      hasSplit.current = true;

      const myCurrentAng = Math.atan2(vel.current.x, vel.current.z);

      onAdd?.({
        startPos: { ...pos.current },
        velocity: { x: Math.sin(myCurrentAng + circulate(45)) * speed, z: Math.cos(myCurrentAng + circulate(45)) * speed },
        generation: 1,
        side
      });

      onAdd?.({
        startPos: { ...pos.current },
        velocity: { x: Math.sin(myCurrentAng - circulate(45)) * speed, z: Math.cos(myCurrentAng - circulate(45)) * speed },
        generation: 1,
        side
      });
    }

    // ==========================================================
    // [★ 사용자 로직 구역 - 2초 분열 (2 -> 4발) 및 본체 삭제]
    // ==========================================================
    if (tick.current > 1.0 && !hasSplitSecond.current && generation === 1) {
      hasSplitSecond.current = true;

      // 1. [교체] 현재 펀치(1세대)는 그만 날아가고 삭제합니다.
      onFinish?.(id);

      // 2. [계승] 현재 날아가던 방향을 기준으로 45도씩 다시 쪼갭니다.
      const myCurrentAng = Math.atan2(vel.current.x, vel.current.z);

      // 자식 소환 A (2세대)
      onAdd?.({
        startPos: { ...pos.current },
        velocity: { x: Math.sin(myCurrentAng + circulate(45)) * speed, z: Math.cos(myCurrentAng + circulate(45)) * speed },
        generation: 2,
        side
      });

      // 자식 소환 B (2세대)
      onAdd?.({
        startPos: { ...pos.current },
        velocity: { x: Math.sin(myCurrentAng - circulate(45)) * speed, z: Math.cos(myCurrentAng - circulate(45)) * speed },
        generation: 2,
        side
      });
    }
    // ==========================================================

    if (tick.current > 4.0) onFinish?.(id);
  });

  return (
    <sprite ref={spriteRef} scale={[1.5, 1.5, 1]}>
      <spriteMaterial map={texture} transparent={true} />
    </sprite>
  );
};
