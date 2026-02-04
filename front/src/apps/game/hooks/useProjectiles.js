import { useState, useCallback } from 'react';

// 투사체 상태 관리 훅
export const useProjectiles = () => {
  const [projectiles, setProjectiles] = useState([]);

  // 새 투사체 추가
  const addProjectile = useCallback((action) => {
    if (action.type === 'shoot') {
      setProjectiles(prev => [...prev, {
        id: Date.now() + Math.random(),
        ...action,
        generation: 0
      }]);
    }
  }, []);

  // 투사체 제거
  const removeProjectile = useCallback((id) => {
    setProjectiles(prev => prev.filter(p => p.id !== id));
  }, []);

  // 분열 처리
  const handleSplit = useCallback((splitData) => {
    setProjectiles(prev => [...prev, {
      id: Date.now() + Math.random(),
      type: 'shoot',
      startPos: splitData.startPos,
      velocity: splitData.velocity,
      rotation: [0, Math.atan2(splitData.velocity.x, splitData.velocity.z), 0],
      duration: 800,
      side: splitData.side,
      generation: splitData.generation
    }]);
  }, []);

  return {
    projectiles,
    addProjectile,
    removeProjectile,
    handleSplit
  };
};
