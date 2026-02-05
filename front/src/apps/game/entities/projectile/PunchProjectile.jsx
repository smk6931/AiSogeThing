import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';

// [도 -> 라디안 변환기]
const circulate = (deg) => deg * (Math.PI / 180);

export const PunchProjectile = ({
  id, startPos, playerRot, onFinish, onUpdate, onAdd,
  generation = 0, side, velocity,
  baseAng // [추가] 부모로부터 물려받은 '기준 각도' 선물
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
    // [★ 1초 시점 분열 (1 -> 2발)] 
    // ==========================================================
    if (tick.current > 1.0 && !hasSplit.current && generation === 0) {
      hasSplit.current = true;

      // [저장] 현재 내 방향(꺾이기 직전 각도)을 계산해서 자식들에게 물려줍니다.
      const myCurrentAng = Math.atan2(vel.current.x, vel.current.z);

      onAdd?.({
        startPos: { ...pos.current },
        velocity: { x: Math.sin(myCurrentAng + circulate(45)) * speed, z: Math.cos(myCurrentAng + circulate(45)) * speed },
        generation: 1,
        baseAng: myCurrentAng, // [선물] "얘야, 이게 우리 가문의 기준 각도란다"
        side
      });

      onAdd?.({
        startPos: { ...pos.current },
        velocity: { x: Math.sin(myCurrentAng - circulate(45)) * speed, z: Math.cos(myCurrentAng - circulate(45)) * speed },
        generation: 1,
        baseAng: myCurrentAng, // [선물]
        side
      });
    }

    // ==========================================================
    // [★ 2초 시점 분열 (2 -> 4발)] 
    // ==========================================================
    if (tick.current > 1.0 && !hasSplitSecond.current && generation === 1) {
      hasSplitSecond.current = true;
      onFinish?.(id); // 현재 1세대는 삭제

      // [사용] 부모한테 물려받은 'baseAng'가 있다면 그걸 쓰고, 없으면 현재 각도 씀
      // const standardAng = baseAng || Math.atan2(vel.current.x, vel.current.z);

      // 자식 소환 A (2세대 - 기준선 기준 위로 45도)
      onAdd?.({
        startPos: { ...pos.current },
        velocity: { x: Math.sin(baseAng + circulate(45)) * speed, z: Math.cos(baseAng + circulate(45)) * speed },
        generation: 2,
        side
      });

      // 자식 소환 B (2세대 - 기준선 기준 아래로 45도)
      onAdd?.({
        startPos: { ...pos.current },
        velocity: { x: Math.sin(baseAng - circulate(45)) * speed, z: Math.cos(baseAng - circulate(45)) * speed },
        generation: 2,
        side
      });
    }

    // 수명 만료 시 삭제
    if (tick.current > 1.0) onFinish?.(id);
  });

  return (
    <sprite ref={spriteRef} scale={[1.5, 1.5, 1]}>
      <spriteMaterial map={texture} transparent={true} />
    </sprite>
  );
};
