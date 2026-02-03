import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

// 피라미드 펀치 컴포넌트 - 분열 시스템
export const PunchProjectile = ({ id, startPos, velocity, duration, onFinish, side, onSplit, generation = 0 }) => {
  const meshRef = useRef();
  const startTime = useRef(Date.now());
  const posRef = useRef({ x: startPos.x, y: startPos.y, z: startPos.z });
  const velocityRef = useRef({ x: velocity.x, z: velocity.z });
  const hasSplit = useRef(false);

  // 왼쪽/오른쪽 색상 구분
  const color = side === 'left' ? '#60a5fa' : '#f87171';
  const emissive = side === 'left' ? '#3b82f6' : '#ef4444';

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const elapsed = Date.now() - startTime.current;
    const splitTime = duration - 50; // duration 끝나기 50ms 전에 분열

    // 분열 로직 (generation 3 미만일 때만)
    if (!hasSplit.current && elapsed >= splitTime && generation < 3) {
      hasSplit.current = true;

      const currentAngle = Math.atan2(velocityRef.current.x, velocityRef.current.z);
      const speed = Math.sqrt(velocityRef.current.x ** 2 + velocityRef.current.z ** 2);
      const spreadAngle = Math.PI / 9; // ±20도

      // 양옆으로 2개 생성
      [currentAngle - spreadAngle, currentAngle + spreadAngle].forEach(angle => {
        onSplit?.({
          startPos: { ...posRef.current },
          velocity: {
            x: Math.sin(angle) * speed,
            z: Math.cos(angle) * speed
          },
          side,
          generation: generation + 1
        });
      });
    }

    // Duration 종료 시 제거
    if (elapsed > duration) {
      onFinish?.(id);
      return;
    }

    // 이동 및 회전
    posRef.current.x += velocityRef.current.x * delta;
    posRef.current.z += velocityRef.current.z * delta;
    meshRef.current.position.set(posRef.current.x, posRef.current.y, posRef.current.z);
    meshRef.current.rotation.y = Math.atan2(velocityRef.current.x, velocityRef.current.z);
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0, 0.5, 2, 4]} />
      <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.8} />
    </mesh>
  );
};
