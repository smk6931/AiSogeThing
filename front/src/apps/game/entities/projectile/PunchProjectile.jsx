import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';

// [도 -> 라디안 변환기] 90 넣으면 1.57이 나옵니다.
const circulate = (deg) => deg * (Math.PI / 180);

export const PunchProjectile = ({ 
    id, startPos, playerRot, onFinish, onUpdate, onAdd, 
    generation = 0, side, velocity 
}) => {
    const spriteRef = useRef();
    const tick = useRef(0); // [언리얼 스타일] 누적 시간(초)
    const pos = useRef({ ...startPos });
    const vel = useRef(velocity); 
    const hasSplit = useRef(false); // [분열 방지용 스위치]
    const texture = useTexture('/golden_punch.png');

    const speed = 2.5; // 속도

    // 부모나 외부에서 속도가 바뀌면 내 속도에 반영
    useEffect(() => { if (velocity) vel.current = velocity; }, [velocity]);

    useFrame((_, delta) => {
        if (!spriteRef.current) return;
        tick.current += delta; // 프레임마다 시간 누적

        // 0. 초기 속도 세팅 (방향 * 속도)
        if (!vel.current) {
            const ang = playerRot + circulate(90); // 90도 (왼쪽)
            vel.current = { 
                x: Math.sin(ang) * speed, 
                z: Math.cos(ang) * speed 
            };
        }

        // 1. 이동
        pos.current.x += vel.current.x * delta;
        pos.current.z += vel.current.z * delta;
        spriteRef.current.position.set(pos.current.x, 1.5, pos.current.z);
        
        // 2. 방향 회전
        const moveAng = Math.atan2(vel.current.x, vel.current.z);
        spriteRef.current.material.rotation = -moveAng + Math.PI;

        // ==========================================================
        // [★ 사용자 로직 구역 - 여기서부터 추가됨] 
        // ==========================================================
        
        // 1. 1초(1.0)가 지났고, 아직 분열하지 않았으며, 최초 부모(generation 0)인 경우
        if (tick.current > 1.0 && !hasSplit.current && generation === 0) {
            hasSplit.current = true; // "나 이제 분열 끝!" 스위치 내림

            // 현재 내가 날아가던 각도 구하기
            const myCurrentAng = Math.atan2(vel.current.x, vel.current.z);

            // [자식 1 소환] 왼쪽(+45도) 방향
            const leftAng = myCurrentAng + circulate(45);
            onAdd?.({
                startPos: { ...pos.current },
                velocity: { x: Math.sin(leftAng) * speed, z: Math.cos(leftAng) * speed },
                generation: 1, // 자식은 더 이상 분열하지 않게 설정
                side
            });

            // [자식 2 소환] 오른쪽(-45도) 방향
            const rightAng = myCurrentAng - circulate(45);
            onAdd?.({
                startPos: { ...pos.current },
                velocity: { x: Math.sin(rightAng) * speed, z: Math.cos(rightAng) * speed },
                generation: 1,
                side
            });

            // 본체(나)는 속도 변화 없이 vel.current 그대로 직진합니다.
        }

        // ==========================================================

        if (tick.current > 10.0) onFinish?.(id);
    });

    return (
        <sprite ref={spriteRef} scale={[1.5, 1.5, 1]}>
            <spriteMaterial map={texture} transparent={true} />
        </sprite>
    );
};
