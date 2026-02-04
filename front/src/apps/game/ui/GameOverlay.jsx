import React, { useState, useEffect } from 'react';
import { Shield, Zap, Sword, Backpack, Map as MapIcon } from 'lucide-react';
import { useAuth } from '@shared/context/AuthContext';

const GameOverlay = ({ onSimulateKey }) => {
  const { user } = useAuth();
  // Mobile Resizing Logic
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Styles Config (Responsive)
  const styles = {
    statusBar: {
      position: 'absolute',
      top: isMobile ? 'max(10px, env(safe-area-inset-top))' : '70px',
      left: isMobile ? 'max(10px, env(safe-area-inset-left))' : '20px',
      width: isMobile ? '160px' : '320px',
      padding: isMobile ? '8px' : '12px',
      borderRadius: '12px',
      background: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(4px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      transition: 'all 0.3s ease'
    },
    minimap: {
      position: 'absolute',
      top: isMobile ? 'max(10px, env(safe-area-inset-top))' : '70px',
      right: isMobile ? 'max(10px, env(safe-area-inset-right))' : '20px',
      width: isMobile ? '90px' : '160px',
      height: isMobile ? '90px' : '160px',
      background: 'rgba(0, 0, 0, 0.6)',
      borderRadius: '50%',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      overflow: 'hidden',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s ease'
    },
    actionBar: {
      position: 'absolute',
      bottom: isMobile ? '120px' : '30px', // 모바일은 조이스틱/하단바 고려하여 위로
      left: '50%',
      transform: 'translateX(-50%)',
      display: isMobile ? 'none' : 'flex',
      gap: isMobile ? '12px' : '24px',
      alignItems: 'flex-end',
      transition: 'all 0.3s ease'
    },
    skillBox: {
      width: isMobile ? '40px' : '60px',
      height: isMobile ? '40px' : '60px',
      background: 'rgba(0,0,0,0.7)',
      border: '1px solid #555',
      borderRadius: '8px',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    itemBox: {
      width: isMobile ? '34px' : '50px',
      height: isMobile ? '34px' : '50px',
      background: 'rgba(0,0,0,0.5)',
      border: '1px solid #444',
      borderRadius: '8px',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  };

  // Dummy Data
  const playerStats = {
    hp: 75, maxHp: 100, mp: 40, maxMp: 100, level: 12, nickname: user?.nickname || 'Hero'
  };

  const skills = [
    { key: 'Q', icon: Sword, cooldown: 0 },
    { key: 'W', icon: Shield, cooldown: 2 },
    { key: 'E', icon: Zap, cooldown: 0 },
    { key: 'R', icon: null, cooldown: 10 },
  ];

  const items = [
    { key: '1', name: 'Potion', count: 5 },
    { key: '2', name: 'Mana', count: 3 },
    { key: '3', name: '', count: 0 },
    { key: '4', name: '', count: 0 },
  ];

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 50 }}>

      {/* 1. Status Bar */}
      <div style={styles.statusBar}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px', gap: '8px' }}>
          <div style={{
            background: '#fbbf24', color: 'black', fontWeight: 'bold', borderRadius: '50%',
            width: isMobile ? '20px' : '28px', height: isMobile ? '20px' : '28px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? '12px' : '16px'
          }}>
            {playerStats.level}
          </div>
          <span style={{ color: 'white', fontWeight: 'bold', fontSize: isMobile ? '14px' : '18px' }}>{playerStats.nickname}</span>
        </div>

        {/* HP & MP Bars */}
        {['hp', 'mp'].map((type) => (
          <div key={type} style={{ marginBottom: type === 'hp' ? '4px' : 0 }}>
            <div style={{ height: isMobile ? '12px' : '18px', background: '#333', borderRadius: '9px', overflow: 'hidden', position: 'relative' }}>
              <div style={{
                width: `${(playerStats[type] / playerStats[`max${type.charAt(0).toUpperCase() + type.slice(1)}`]) * 100}%`,
                background: type === 'hp' ? 'linear-gradient(90deg, #ef4444 0%, #b91c1c 100%)' : 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)',
                height: '100%', transition: 'width 0.3s'
              }} />
              <span style={{
                position: 'absolute', inset: 0, fontSize: isMobile ? '9px' : '11px', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center', textShadow: '1px 1px 1px black'
              }}>
                {playerStats[type]} / {playerStats[`max${type.charAt(0).toUpperCase() + type.slice(1)}`]}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 2. Minimap */}
      <div style={styles.minimap}>
        <div style={{
          position: 'absolute', width: '200%', height: '200%', opacity: 0.2,
          backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px'
        }}></div>
        <div style={{ width: '8px', height: '8px', background: '#4ade80', borderRadius: '50%', boxShadow: '0 0 5px #4ade80', zIndex: 2 }}></div>
        <span style={{ position: 'absolute', bottom: '10px', fontSize: isMobile ? '9px' : '12px', color: '#ccc' }}>Minimap</span>
      </div>

      {/* 3. Action Bar */}
      <div style={styles.actionBar}>
        {/* Skills */}
        <div style={{ display: 'flex', gap: isMobile ? '4px' : '8px' }}>
          {skills.map((skill, idx) => (
            <div key={idx} style={styles.skillBox}>
              <span style={{ position: 'absolute', top: '2px', left: '4px', fontSize: isMobile ? '9px' : '12px', color: '#ddd', fontWeight: 'bold' }}>{skill.key}</span>
              {skill.icon ? <skill.icon size={isMobile ? 18 : 30} color={skill.cooldown > 0 ? '#555' : 'white'} /> : null}
              {skill.cooldown > 0 && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: isMobile ? '14px' : '20px' }}>
                  {skill.cooldown}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ width: '1px', height: isMobile ? '30px' : '50px', background: 'rgba(255,255,255,0.2)' }}></div>

        {/* Items */}
        <div style={{ display: 'flex', gap: isMobile ? '4px' : '8px' }}>
          {items.map((item, idx) => (
            <div key={idx} style={styles.itemBox}>
              <span style={{ position: 'absolute', top: '2px', left: '3px', fontSize: isMobile ? '8px' : '11px', color: '#aaa' }}>{item.key}</span>
              {item.name === 'Potion' && <div style={{ width: isMobile ? '14px' : '20px', height: isMobile ? '14px' : '20px', background: '#ef4444', borderRadius: '50%' }}></div>}
              {item.name === 'Mana' && <div style={{ width: isMobile ? '14px' : '20px', height: isMobile ? '14px' : '20px', background: '#3b82f6', borderRadius: '50%' }}></div>}
              {item.count > 0 && <span style={{ position: 'absolute', bottom: '2px', right: '4px', fontSize: isMobile ? '9px' : '12px', color: 'white', fontWeight: 'bold' }}>{item.count}</span>}
            </div>
          ))}
        </div>


      </div>

      {/* 4. Mobile Attack Button (Right Side) */}
      {
        isMobile && (
          <div
            style={{
              position: 'absolute',
              bottom: '40px', // 조이스틱과 높이 맞춤
              right: '25px',
              width: '60px',  // 크기 축소 (80 -> 60)
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(255, 0, 0, 0.5)',
              border: '2px solid rgba(255, 255, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '24px', // 폰트 축소
              backdropFilter: 'blur(4px)',
              zIndex: 90,
              cursor: 'pointer',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              touchAction: 'manipulation'
            }}
            onTouchStart={(e) => { e.preventDefault(); onSimulateKey('r', true); }}
            onTouchEnd={(e) => { e.preventDefault(); onSimulateKey('r', false); }}
            onMouseDown={() => onSimulateKey('r', true)} // PC 테스트용
            onMouseUp={() => onSimulateKey('r', false)}
          >
            👊
          </div>
        )
      }

    </div >
  );
};

export default GameOverlay;
