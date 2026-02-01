import React, { useState, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import Player from '../entities/Player';

// 건물 컴포넌트 (클릭 가능)
const Building = ({ position, color, label, onClick }) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current && hovered) {
      // 호버 시 살짝 떠오르는 애니메이션
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    } else if (meshRef.current) {
      meshRef.current.position.y = position[1];
    }
  });

  return (
    <group position={position}>
      {/* 건물 본체 */}
      <mesh
        ref={meshRef}
        castShadow
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[2, 3, 2]} />
        <meshStandardMaterial
          color={hovered ? '#ff6b6b' : color}
          emissive={hovered ? '#ff0000' : '#000000'}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </mesh>

      {/* 건물 이름표 */}
      <Text
        position={[0, 2.5, 0]}
        fontSize={0.4}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        {label}
      </Text>

      {/* 아이콘 (이모지) */}
      <Text
        position={[0, 1.2, 1.1]}
        fontSize={0.8}
        anchorX="center"
        anchorY="middle"
      >
        {label === '영화관' ? '🎬' :
          label === '우체국' ? '📮' :
            label === '안내소' ? '🗺️' :
              label === '도서관' ? '📚' :
                label === '구청' ? '📢' :
                  label === '카페' ? '☕' : '🏢'}
      </Text>
    </group>
  );
};

const RpgWorld = ({ onBuildingClick, input }) => {
  const handleBuildingClick = (buildingName) => {
    console.log(`${buildingName} 클릭됨!`);
    if (onBuildingClick) {
      onBuildingClick(buildingName);
    }
  };

  return (
    <group>
      {/* 바닥 (타일맵) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.1, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#3a5a40" />
      </mesh>

      {/* 그리드 (격자무늬) */}
      <gridHelper args={[30, 30, '#588157', '#588157']} position={[0, 0, 0]} />

      {/* 건물들 배치 (아이소메트릭 느낌으로 배치) */}
      <Building
        position={[-5, 1.5, -5]}
        color="#ff6b6b"
        label="영화관"
        onClick={() => handleBuildingClick('영화관 (YouTube)')}
      />

      <Building
        position={[5, 1.5, -5]}
        color="#4ecdc4"
        label="우체국"
        onClick={() => handleBuildingClick('우체국 (채팅)')}
      />

      <Building
        position={[-5, 1.5, 5]}
        color="#ffe66d"
        label="안내소"
        onClick={() => handleBuildingClick('안내소 (지도/데이트코스)')}
      />

      <Building
        position={[5, 1.5, 5]}
        color="#a8dadc"
        label="도서관"
        onClick={() => handleBuildingClick('도서관 (웹툰/소설)')}
      />

      <Building
        position={[0, 1.5, -8]}
        color="#b5838d"
        label="구청"
        onClick={() => handleBuildingClick('구청 (커뮤니티/피드)')}
      />

      <Building
        position={[0, 1.5, 8]}
        color="#ffb4a2"
        label="카페"
        onClick={() => handleBuildingClick('카페 (매칭)')}
      />

      <Building
        position={[0, 1.5, 8]}
        color="#ffb4a2"
        label="카페"
        onClick={() => handleBuildingClick('카페 (매칭)')}
      />

      {/* 플레이어 (입력값으로 제어) */}
      <Player input={input} />
    </group>
  );
};

export default RpgWorld;
