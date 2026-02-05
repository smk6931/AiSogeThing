import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
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

      {Object.entries(otherPlayers).map(([id, data]) => (
        <RemotePlayer key={id} position={{ x: data.x, z: data.z }} rotation={data.rotation} nickname={data.nickname || 'Unknown'} chat={latestChatMap[id]} />
      ))}

      <Player
        ref={playerRef}
        input={input}
        actions={inputActions}
        onMove={sendPosition}
        onAction={(pos, rot) => {
          const params = { startPos: { x: pos.x, y: 1.5, z: pos.z }, playerRot: rot };
          add({ ...params, side: 'left' });
          add({ ...params, side: 'right' });
        }}
        chat={user && latestChatMap ? latestChatMap[user.id] : null}
      />

      {projectiles.map(p => (
        <PunchProjectile
          key={p.id} id={p.id} onFinish={remove} onUpdate={update} onAdd={add}
          {...p}
        />
      ))}
    </group>
  );
};

export default RpgWorld;
