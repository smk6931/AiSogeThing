import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import Player from '../entities/Player';
import RemotePlayer from '../entities/RemotePlayer';
import ZoomController from '../core/ZoomController';
import { useAuth } from '@shared/context/AuthContext';
import { PunchProjectile } from '../entities/projectile/PunchProjectile';
import { useProjectiles } from '../hooks/useProjectiles';

const CameraRig = ({ target }) => {
  const { camera } = useThree();
  const vec = new THREE.Vector3();
  useEffect(() => {
    camera.position.set(0, 30, 20);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  useFrame(() => {
    if (target.current) {
      const targetPos = target.current.position;
      camera.position.lerp(vec.set(targetPos.x, targetPos.y + 30, targetPos.z + 20), 0.1);
    }
  });
  return null;
};

const MapFloor = () => {
  const texture = useTexture('/map_texture.jpg');
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.1, 0]}>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
};

const RpgWorld = ({ input, otherPlayers, sendPosition, latestChatMap, inputActions }) => {
  const playerRef = useRef();
  const { user } = useAuth();
  const { projectiles, add, update, remove } = useProjectiles();

  return (
    <group>
      <CameraRig target={playerRef} />
      <ZoomController />
      <MapFloor />

      {/* 다른 플레이어들 */}
      {Object.entries(otherPlayers).map(([id, data]) => (
        <RemotePlayer key={id} position={{ x: data.x, z: data.z }} rotation={data.rotation} nickname={data.nickname || 'Unknown'} chat={latestChatMap[id]} />
      ))}

      {/* 내 플레이어 (여기가 스킬 소환소입니다) */}
      <Player
        ref={playerRef}
        input={input}
        actions={inputActions}
        onMove={sendPosition}
        onAction={(pos, rot) => {
          // 여기서 최초 2발 소환 (완벽한 양옆 일직선: 1.57)
          const spawn = (ang, side) => {
            add({
              startPos: {
                x: pos.x + Math.sin(rot + ang) * 2.5,
                y: 1.5,
                z: pos.z + Math.cos(rot + ang) * 2.5
              },
              playerRot: rot,
              side
            });
          };
          spawn(1.57, 'left');
          spawn(-1.57, 'right');
        }}
        chat={user && latestChatMap ? latestChatMap[user.id] : null}
      />

      {/* 발사체 렌더 룸 */}
      {projectiles.map(p => (
        <PunchProjectile
          key={p.id} id={p.id} onFinish={remove} onUpdate={update} onAdd={add}
          {...p} // 나머지 모든 데이터(pos, rot, side 등) 전달
        />
      ))}
    </group>
  );
};

export default RpgWorld;
