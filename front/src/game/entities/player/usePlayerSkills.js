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
    // [스킬 설명: 얍카 피라미드 펀치 (Golden Pyramid Punch)]
    // 1. 설치형 (Installation): 스킬 시전 시점의 캐릭터 위치(`snapshotPos`)와 회전(`snapshotRot`)을 스냅샷으로 저장합니다.
    // 2. 양방향 발사 (Side Fire): 캐릭터 기준 정확히 90도 왼쪽과 오른쪽으로 발사됩니다.
    // 3. 독립 궤적 (Independent Velocity): 속도 벡터를 명시적으로 계산하여 각자의 방향으로 직진합니다.

    const waves = [1];
    const projectileSpeed = 8.0;

    // ==========================================
    // [각도 조절] 90도 (완전 옆)
    const angleLeft = Math.PI / 2;
    const angleRight = -Math.PI / 2;
    // ==========================================

    if (!ref.current) return;
    const snapshotRot = ref.current.rotation.y;
    const snapshotPos = ref.current.position.clone();

    waves.forEach((count) => {
      // 1. 왼쪽 스트림 (Left Stream)
      const dirLeft = {
        x: Math.sin(snapshotRot + angleLeft),
        z: Math.cos(snapshotRot + angleLeft)
      };
      // [핵심] 속도 벡터 명시적 계산
      const velocityLeft = {
        x: dirLeft.x * projectileSpeed,
        z: dirLeft.z * projectileSpeed
      };
      // [핵심] 회전값 명시적 계산 (Y축 회전)
      const rotationLeft = [0, Math.atan2(dirLeft.x, dirLeft.z), 0];

      const startPosLeft = {
        x: snapshotPos.x + dirLeft.x * 1.5,
        y: 1,
        z: snapshotPos.z + dirLeft.z * 1.5
      };

      spawnProjectiles(startPosLeft, velocityLeft, rotationLeft, 5000, 'left');

      // 2. 오른쪽 스트림 (Right Stream)
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
        x: snapshotPos.x + dirRight.x * 1.5,
        y: 1,
        z: snapshotPos.z + dirRight.z * 1.5
      };

      spawnProjectiles(startPosRight, velocityRight, rotationRight, 5000, 'right');
    });
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
