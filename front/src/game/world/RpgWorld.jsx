import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import Player from '../entities/Player';
import ZoomController from '../core/ZoomController';

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

// 카메라맨 컴포넌트 (플레이어를 따라다님 + 고정 앵글)
const CameraRig = ({ target }) => {
  const { camera } = useThree();
  const vec = new THREE.Vector3();

  // 1. 초기 각도 고정 (딱 한 번만 실행)
  useEffect(() => {
    const initialOffset = new THREE.Vector3(0, 30, 20); // 오프셋 기준 (가디언 테일즈 뷰)
    const tempPos = camera.position.clone();

    // 초기 카메라 위치를 잠시 오프셋 위치로 옮겨서 lookAt으로 각도를 잡음
    camera.position.copy(initialOffset);
    camera.lookAt(0, 0, 0);

    // 다시 원래 위치(혹은 타겟 위치 근처)로 되돌릴 준비는 useFrame에서 처리
    // 여기서는 '각도(Rotation/Quaternion)'를 세팅하는 것이 목적
  }, [camera]);

  useFrame(() => {
    if (target.current) {
      // 2. 위치만 부드럽게 추적 (회전 X)
      const offset = new THREE.Vector3(0, 30, 20);
      const targetPos = target.current.position;

      // lerp로 위치만 따라가고, lookAt은 호출하지 않음으로써 회전 고정
      camera.position.lerp(vec.copy(targetPos).add(offset), 0.1);
    }
  });
  return null;
};

// 바닥 컴포넌트 (텍스처 로딩)
// 바닥 컴포넌트 (텍스처 로딩)
const MapFloor = () => {
  // 실제 RPG 느낌이 나는 잔디/지형 텍스처 (Three.js 예제 소스 활용)
  const texture = useTexture('/map_texture.jpg');

  // 텍스처 반복 설정 (20x20으로 촘촘하게 타일링)
  texture.repeat.set(1, 1);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

  return (
    <group>
      {/* 텍스처 바닥 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.1, 0]}>
        <planeGeometry args={[100, 100]} />
        {/* 잔디 느낌을 살리기 위해 약간 어둡고(dark) 거칠게 표현 */}
        <meshStandardMaterial map={texture} />
      </mesh>
    </group>
  );
};

const RpgWorld = ({ onBuildingClick, input }) => {
  const playerRef = useRef();

  const handleBuildingClick = (buildingName) => {
    if (onBuildingClick) {
      onBuildingClick(buildingName);
    }
  };

  return (
    <group>
      {/* 시스템: 카메라맨 & 줌 */}
      <CameraRig target={playerRef} />
      <ZoomController />

      {/* 환경: 바닥(지도) */}
      <MapFloor />

      {/* 오브젝트: 건물들 */}
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

      {/* 플레이어 */}
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
