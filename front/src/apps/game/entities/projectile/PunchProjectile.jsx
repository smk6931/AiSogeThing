import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';

/**
 * [피라미드 펀치 - 진짜 2D 방식 Yaw 회전 버전]
 * Pitch/Roll 무시! 오직 Yaw(Y축) 회전만 사용하여 2D 스프라이트처럼 처리합니다.
 */
export const PunchProjectile = ({
  id, startPos, playerRot, onFinish, onUpdate, onAdd,
  generation = 0, side, velocity
}) => {
  const spriteRef = useRef();
  const startTime = useRef(Date.now());
  const posRef = useRef({ ...startPos });
  const velRef = useRef(velocity);
  const hasSplit = useRef(false);

  // 황금 펀치 텍스처
  const texture = useTexture('/golden_punch.png');

  // 부모가 "꺾어!"라고 하면 내 속도(velRef)를 즉시 업데이트
  useEffect(() => {
    if (velocity) velRef.current = velocity;
  }, [velocity]);

  useFrame((_, delta) => {
    if (!spriteRef.current) return;

    // 0. 최초 발사 (옆구리 90도 = 1.57 방향)
    if (!velRef.current) {
      const startAng = playerRot + (side === 'left' ? 1.57 : -1.57);
      velRef.current = {
        x: Math.sin(startAng) * 2.0,
        z: Math.cos(startAng) * 2.0
      };
    }

    const elapsed = Date.now() - startTime.current;

    // 1. [Tick 이동] 2.0 속도로 매 프레임 전진
    posRef.current.x += velRef.current.x * delta;
    posRef.current.z += velRef.current.z * delta;
    spriteRef.current.position.set(posRef.current.x, posRef.current.y, posRef.current.z);

    // [핵심] 진행 방향에 맞춰 스프라이트 이미지 회전 (2D Yaw 회전)
    const moveAng = Math.atan2(velRef.current.x, velRef.current.z);
    spriteRef.current.material.rotation = -moveAng + Math.PI; // 텍스처 방향 보정

    // 2. [V자 분열 로직] (1단계 전용: 1개 -> 2개)
    if (!hasSplit.current && elapsed >= 1000 && generation < 1) {
      hasSplit.current = true;

      const curAng = Math.atan2(velRef.current.x, velRef.current.z);
      let myNextAng, friendAng;

      // 오른쪽 펀치 기준: 본체는 45도(0.78) 앞으로 꺾고, 분신은 거기서 90도(1.57) 뒤로 꺾음
      if (side === 'right') {
        myNextAng = curAng + 0.78;
        friendAng = myNextAng - 1.57;
      } else {
        myNextAng = curAng - 0.78;
        friendAng = myNextAng + 1.57;
      }

      // 본체 속도/각도 업데이트
      const newVel = { x: Math.sin(myNextAng) * 2.0, z: Math.cos(myNextAng) * 2.0 };
      velRef.current = newVel;
      onUpdate?.(id, { velocity: newVel, generation: generation + 1 });

      // 분신(새 친구) 소환
      onAdd?.({
        startPos: { ...posRef.current },
        velocity: { x: Math.sin(friendAng) * 2.0, z: Math.cos(friendAng) * 2.0 },
        generation: generation + 1,
        side
      });
    }

    // 전체 수명 3초
    if (elapsed > 3000) onFinish?.(id);
  });

  return (
    <sprite ref={spriteRef} scale={[1.5, 1.5, 1]}>
      <spriteMaterial map={texture} transparent={true} />
    </sprite>
  );
};
