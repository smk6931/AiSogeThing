import React, { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import Player from '../entities/Player';

// 건물 컴포넌트
const Building = ({ position, color, label, onClick, icon }) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current && hovered) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.1;
    } else if (meshRef.current) {
      meshRef.current.position.y = position[1];
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[2, 3, 2]} />
        <meshStandardMaterial
          color={hovered ? '#ff8787' : color}
          emissive={hovered ? '#ff0000' : '#000000'}
          emissiveIntensity={hovered ? 0.2 : 0}
        />
      </mesh>
      <Text position={[0, 2.8, 0]} fontSize={0.5} color="white" anchorX="center" anchorY="middle" outlineWidth={0.05} outlineColor="black">
        {label}
      </Text>
      <Text position={[0, 1.2, 1.1]} fontSize={1} anchorX="center" anchorY="middle">
        {icon}
      </Text>
    </group>
  );
};

// 카메라맨 컴포넌트 (플레이어를 따라다님)
const CameraRig = ({ target }) => {
  const { camera } = useThree();
  const vec = new THREE.Vector3();

  useFrame(() => {
    if (target.current) {
      // 목표 위치: 플레이어 위치 + 오프셋
      // (0, 30, 20) -> X축 정렬(기울어짐 없음), Y축 높게(Top-down 느낌), Z축 뒤로(거리감)
      // 이것이 '젤다/가디언 테일즈' 스타일 뷰
      const offset = new THREE.Vector3(0, 30, 20);
      const targetPos = target.current.position;

      // 부드러운 이동 (Lerp)
      // 현재 카메라 위치에서 목표 위치로 0.1의 속도로 이동
      camera.position.lerp(vec.copy(targetPos).add(offset), 0.1);

      // 카메라는 항상 플레이어를 바라봄
      camera.lookAt(targetPos);
    }
  });
  return null;
};

const RpgWorld = ({ onBuildingClick, input }) => {
  const playerRef = useRef(); // 플레이어 참조 생성

  const handleBuildingClick = (buildingName) => {
    if (onBuildingClick) {
      onBuildingClick(buildingName);
    }
  };

  return (
    <group>
      {/* 카메라맨 배치 (플레이어 감시) */}
      <CameraRig target={playerRef} />

      {/* 바닥 (타일맵) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.1, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#3a5a40" />
      </mesh>
      <gridHelper args={[100, 100, '#588157', '#588157']} position={[0, 0, 0]} />

      {/* 건물 배치 */}
      <Building
        position={[-8, 1.5, -8]}
        color="#ff6b6b"
        label="영화관"
        icon="🎬"
        onClick={() => handleBuildingClick('영화관 (YouTube)')}
      />

      <Building
        position={[8, 1.5, -8]}
        color="#4ecdc4"
        label="우체국"
        icon="📮"
        onClick={() => handleBuildingClick('우체국 (채팅)')}
      />

      <Building
        position={[-8, 1.5, 8]}
        color="#ffe66d"
        label="안내소"
        icon="🗺️"
        onClick={() => handleBuildingClick('안내소 (지도/데이트코스)')}
      />

      <Building
        position={[8, 1.5, 8]}
        color="#a8dadc"
        label="도서관"
        icon="📚"
        onClick={() => handleBuildingClick('도서관 (웹툰/소설)')}
      />

      <Building
        position={[0, 1.5, -12]}
        color="#b5838d"
        label="구청"
        icon="📢"
        onClick={() => handleBuildingClick('구청 (커뮤니티/피드)')}
      />

      <Building
        position={[0, 1.5, 12]}
        color="#ffb4a2"
        label="카페"
        icon="☕"
        onClick={() => handleBuildingClick('카페 (매칭)')}
      />

      {/* 플레이어 (ref 연결) */}
      <Player ref={playerRef} input={input} />

      {/* 시작 지점 표시 */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 1, 32]} />
        <meshBasicMaterial color="white" opacity={0.5} transparent />
      </mesh>
    </group>
  );
};

export default RpgWorld;
