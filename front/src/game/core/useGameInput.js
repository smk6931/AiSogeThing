import { useState, useEffect } from 'react';

// 입력 상태 관리 훅 (키보드 + 조이스틱 통합)
export const useGameInput = () => {
  const [input, setInput] = useState({ x: 0, y: 0, isMoving: false });
  const [keys, setKeys] = useState({ w: false, a: false, s: false, d: false });

  // 키보드 이벤트 리스너
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(key)) {
        setKeys(prev => ({ ...prev, [key]: true }));
      }
    };

    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(key)) {
        setKeys(prev => ({ ...prev, [key]: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // 키 입력 → 벡터 변환
  useEffect(() => {
    let x = 0;
    let y = 0;

    if (keys.w) y -= 1;
    if (keys.s) y += 1;
    if (keys.a) x -= 1;
    if (keys.d) x += 1;

    // 조이스틱 입력이 없을 때만 키보드 값 사용 (조이스틱 우선)
    if (!input.joystickActive) {
      const isMoving = x !== 0 || y !== 0;
      // 대각선 이동 시 속도 정규화 (1.414 방지)
      if (isMoving) {
        const length = Math.sqrt(x * x + y * y);
        x /= length;
        y /= length;
      }
      setInput(prev => ({ ...prev, x, y, isMoving, source: 'keyboard' }));
    }
  }, [keys]);

  // 조이스틱 핸들러 (외부에서 호출)
  const handleJoystickMove = (event) => {
    if (event.type === 'move') {
      setInput({
        x: event.x / 50, // 정규화 (-1 ~ 1)
        y: -event.y / 50, // Y축 반전
        isMoving: true,
        joystickActive: true,
        source: 'joystick'
      });
    } else {
      setInput(prev => ({ ...prev, x: 0, y: 0, isMoving: false, joystickActive: false }));
    }
  };

  return { input, handleJoystickMove };
};
