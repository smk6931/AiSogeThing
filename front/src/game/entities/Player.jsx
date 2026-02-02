import React, { forwardRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';

// forwardRef로 변경하여 부모(RpgWorld)가 플레이어의 위치에 접근할 수 있게 함
const Player = forwardRef(({ input, onMove, chat }, ref) => {
  const [showChat, setShowChat] = useState(false);

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
