import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

// 마우스 휠로 줌 인/아웃 컨트롤러
const ZoomController = () => {
  const { camera } = useThree();

  useEffect(() => {
    const handleWheel = (event) => {
      event.preventDefault();

      // 휠 방향에 따라 줌 조절 (속도 대폭 증가)
      const zoomSpeed = 2; // 0.1 -> 2.0 (20배 빠르게)
      const delta = event.deltaY > 0 ? -zoomSpeed : zoomSpeed;

      // 줌 범위 확장 (5 ~ 100)
      camera.zoom = Math.max(5, Math.min(100, camera.zoom + delta));
      camera.updateProjectionMatrix(); // 중요: zoom 변경 후 반드시 호출
    };

    // passive: false로 설정해야 preventDefault()가 작동함
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [camera]);

  return null;
};

export default ZoomController;
