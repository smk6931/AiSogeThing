import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export const usePlayerSkills = (ref, actions, onAction) => {
  const prevSkillRef = useRef(false); // 스킬 키 엣지 트리거용

  useFrame(() => {
    if (!ref.current) return;

    // 공격 트리거 (R키 & 조이스틱)
    if (actions?.skill1 && !prevSkillRef.current) {
      triggerPyramidSkill();
    }
    prevSkillRef.current = actions?.skill1;
  });

  const triggerPyramidSkill = () => {
    // [스킬 설명: 얍카 피라미드 펀치 - 분열 시스템]
    // 처음 양옆으로 1개씩 발사 → 0.5초마다 각각 2개로 분열
    // 0초: 2개 → 0.5초: 4개 → 1초: 8개 → 1.5초: 16개

    const projectileSpeed = 2.0; // 속도를 대폭 상향하여 시원하게 날아가게 함
    const initialDuration = 400; // 첫 분열까지의 시간을 늘려 간격을 확보 (0.4초)

    // ==========================================
    // [각도 조절] 85도 (약간 앞으로 쏠리게 조정)
    const angleLeft = Math.PI * 0.45;
    const angleRight = -Math.PI * 0.45;
    // ==========================================

    if (!ref.current) return;
    const snapshotRot = ref.current.rotation.y;
    const snapshotPos = ref.current.position.clone();

    // 1. 왼쪽 발사
    const dirLeft = {
      x: Math.sin(snapshotRot + angleLeft),
      z: Math.cos(snapshotRot + angleLeft)
    };
    const velocityLeft = {
      x: dirLeft.x * projectileSpeed,
      z: dirLeft.z * projectileSpeed
    };
    const rotationLeft = [0, Math.atan2(dirLeft.x, dirLeft.z), 0];
    const startPosLeft = {
      x: snapshotPos.x + dirLeft.x * 2.5, // 시작 거리를 2.5로 키움
      y: 1.5,
      z: snapshotPos.z + dirLeft.z * 2.5
    };

    spawnProjectiles(startPosLeft, velocityLeft, rotationLeft, initialDuration, 'left');

    // 2. 오른쪽 발사
    const dirRight = {
      x: Math.sin(snapshotRot + angleRight),
      z: Math.cos(snapshotRot + angleRight)
    };
    const velocityRight = {
      x: dirRight.x * projectileSpeed,
      z: dirRight.z * projectileSpeed
    };
    const rotationRight = [0, Math.atan2(dirRight.x, dirRight.z), 0];
    const startPosRight = {
      x: snapshotPos.x + dirRight.x * 2.5, // 시작 거리를 2.5로 키움
      y: 1.5,
      z: snapshotPos.z + dirRight.z * 2.5
    };

    spawnProjectiles(startPosRight, velocityRight, rotationRight, initialDuration, 'right');
  };

  const spawnProjectiles = (startPos, velocity, rotation, duration, side) => {
    // [투사체 생성]
    // 계산된 velocity와 rotation을 그대로 사용하여 발사
    if (onAction) {
      onAction({
        type: 'shoot',
        startPos,
        velocity,
        rotation,
        duration,
        side // 'left' or 'right' 구분용
      });
    }
  };
};
