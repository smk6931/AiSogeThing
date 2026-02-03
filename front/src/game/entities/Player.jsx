import React, { forwardRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';

const Player = forwardRef(({ input, actions, onMove, onAction, chat }, ref) => {
  const [showChat, setShowChat] = useState(false);
  const prevSkillRef = React.useRef(false); // 스킬 키 엣지 트리거용

  useEffect(() => {
    if (chat && chat.timestamp) {
      setShowChat(true);
      const timer = setTimeout(() => setShowChat(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [chat]);
  const speed = 4.0; // 모바일 터치 이동 속도 향상
  const lastSendTime = React.useRef(0);

  useFrame((state) => {
    if (!ref.current) return;

    // 공격 트리거 (R키 & 조이스틱)
    if (actions?.skill1 && !prevSkillRef.current) {
      triggerPyramidSkill();
    }
    prevSkillRef.current = actions?.skill1;

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

  const triggerPyramidSkill = () => {
    // 얍카 피라미드 펀치: 1 -> 2 -> 4 -> 8 분열
    const waves = [1, 2, 4, 8, 16, 32];
    const waveDelay = 250; // 0.25초마다 분열
    const projectileSpeed = 8.0; // 투사체 이동 속도

    // ==========================================
    // [각도 조절] 여기서 왼쪽/오른쪽 발사 각도를 조절하세요
    // Math.PI / 2 = 90도 (완전 옆)
    // Math.PI / 4 = 45도 (대각선)
    const angleLeft = Math.PI / 2;  // 왼쪽 방향 (약 90도)
    const angleRight = -Math.PI / 2; // 오른쪽 방향 (약 -90도)
    // ==========================================

    waves.forEach((count, waveIndex) => {
      setTimeout(() => {
        if (!ref.current) return;
        const playerRot = ref.current.rotation.y;
        const playerPos = ref.current.position;

        // 투사체가 날아간 거리 계산 (분열 위치)
        // 이전 웨이브가 날아간 거리만큼 떨어진 곳에서 생성됨
        const distanceTraveled = waveIndex * (waveDelay / 1000) * projectileSpeed;

        // 1. 왼쪽 스트림 (Left Stream)
        // 플레이어 회전 + 왼쪽 각도
        const dirLeft = {
          x: Math.sin(playerRot + angleLeft),
          z: Math.cos(playerRot + angleLeft)
        };
        // 시작 위치: 플레이어 위치 + (방향 * 거리)
        const startPosLeft = {
          x: playerPos.x + dirLeft.x * distanceTraveled,
          y: 1,
          z: playerPos.z + dirLeft.z * distanceTraveled
        };
        spawnProjectiles(startPosLeft, dirLeft, count, projectileSpeed, waveDelay);


        // 2. 오른쪽 스트림 (Right Stream)
        // 플레이어 회전 + 오른쪽 각도
        const dirRight = {
          x: Math.sin(playerRot + angleRight),
          z: Math.cos(playerRot + angleRight)
        };
        const startPosRight = {
          x: playerPos.x + dirRight.x * distanceTraveled,
          y: 1,
          z: playerPos.z + dirRight.z * distanceTraveled
        };
        spawnProjectiles(startPosRight, dirRight, count, projectileSpeed, waveDelay);

      }, waveIndex * waveDelay);
    });
  };

  const spawnProjectiles = (origin, dir, count, speed, duration) => {
    // 진행 방향의 수직 벡터 (Spread 용)
    // Forward(Dir) -> Right Vector = (dir.z, -dir.x) ? 
    // Standard 2D norm: (-y, x) or (y, -x).
    const spreadVec = { x: -dir.z, z: dir.x };

    for (let i = 0; i < count; i++) {
      // 퍼짐 간격 (점점 넓게)
      // 1발일때 0. 2발일때 -0.4, 0.4
      const offset = (i - (count - 1) / 2) * 0.8;

      const startPos = {
        x: origin.x + spreadVec.x * offset,
        y: origin.y,
        z: origin.z + spreadVec.z * offset
      };

      const velocity = {
        x: dir.x * speed,
        z: dir.z * speed
      };

      if (onAction) {
        onAction({
          type: 'shoot',
          startPos,
          velocity,
          rotation: [Math.PI / 2, Math.atan2(dir.x, dir.z), 0], // 진행 방향 보기
          duration: duration + 50 // 약간의 오버랩
        });
      }
    }
  };

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

      {/* 그림자용 바닥 원형 (선택) */}
      <mesh position={[0, -0.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.6, 32]} />
        <meshBasicMaterial color="black" opacity={0.3} transparent />
      </mesh>

      {/* 피라미드 펀치 이펙트 */}


      {/* 이름표 */}
      {/* 이름표 */}
      {/* 이름표 (숨김 처리) */}
      {/* <Text
        position={[0, 1.3, 0]}
        fontSize={0.4}
        color="white"
        anchorX="center"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        Me
      </Text> */}

      {/* 말풍선 */}
      {showChat && (
        <Html position={[0, 4.0, 0]} center>
          <div style={{
            background: 'white',
            color: 'black',
            padding: '8px 12px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            border: '2px solid #333',
            position: 'relative',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            animation: 'popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            zIndex: 100
          }}>
            {chat.message}
            <div style={{
              position: 'absolute',
              bottom: '-6px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid white'
            }}></div>
          </div>
          <style>{`
            @keyframes popIn {
              from { transform: scale(0); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
          `}</style>
        </Html>
      )}
    </group>
  );
});

export default Player;
