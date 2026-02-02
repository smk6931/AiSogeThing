import React from 'react';
import { Shield, Zap, Sword, Backpack, Map as MapIcon } from 'lucide-react';

const GameOverlay = () => {
  // Dummy Data for visualization
  const playerStats = {
    hp: 75,
    maxHp: 100,
    mp: 40,
    maxMp: 100,
    level: 12,
    nickname: 'Hero'
  };

  const skills = [
    { key: 'Q', icon: Sword, cooldown: 0 },
    { key: 'W', icon: Shield, cooldown: 2 },
    { key: 'E', icon: Zap, cooldown: 0 },
    { key: 'R', icon: null, cooldown: 10 }, // Empty slot example or Ultimate
  ];

  const items = [
    { key: '1', name: 'Potion', count: 5 },
    { key: '2', name: 'Mana', count: 3 },
    { key: '3', name: '', count: 0 },
    { key: '4', name: '', count: 0 },
  ];

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none', // Lets clicks pass through to the canvas/joystick
      zIndex: 50 // Below Joystick (90) but above Canvas
    }}>

      {/* 1. Top Left: Character Status (HP/MP) */}
      <div style={{
        position: 'absolute',
        top: '70px', // Below the top HUD
        left: '20px',
        width: '250px',
        background: 'rgba(0, 0, 0, 0.5)',
        padding: '10px',
        borderRadius: '10px',
        backdropFilter: 'blur(4px)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* Level & Name */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px', gap: '8px' }}>
          <div style={{
            background: '#fbbf24', color: 'black', fontWeight: 'bold',
            borderRadius: '50%', width: '24px', height: '24px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px'
          }}>
            {playerStats.level}
          </div>
          <span style={{ color: 'white', fontWeight: 'bold', fontSize: '16px' }}>{playerStats.nickname}</span>
        </div>

        {/* HP Bar */}
        <div style={{ marginBottom: '4px' }}>
          <div style={{ height: '14px', background: '#333', borderRadius: '7px', overflow: 'hidden', position: 'relative' }}>
            <div style={{
              width: `${(playerStats.hp / playerStats.maxHp) * 100}%`,
              background: 'linear-gradient(90deg, #ef4444 0%, #b91c1c 100%)',
              height: '100%',
              transition: 'width 0.3s'
            }} />
            <span style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              fontSize: '10px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              textShadow: '1px 1px 1px black'
            }}>
              {playerStats.hp} / {playerStats.maxHp}
            </span>
          </div>
        </div>

        {/* MP Bar */}
        <div>
          <div style={{ height: '14px', background: '#333', borderRadius: '7px', overflow: 'hidden', position: 'relative' }}>
            <div style={{
              width: `${(playerStats.mp / playerStats.maxMp) * 100}%`,
              background: 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)',
              height: '100%',
              transition: 'width 0.3s'
            }} />
            <span style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              fontSize: '10px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              textShadow: '1px 1px 1px black'
            }}>
              {playerStats.mp} / {playerStats.maxMp}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Top Right: Minimap */}
      <div style={{
        position: 'absolute',
        top: '70px',
        right: '20px',
        width: '120px',
        height: '120px',
        background: 'rgba(0, 0, 0, 0.6)',
        borderRadius: '50%',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        overflow: 'hidden',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Grid pattern to simulate map */}
        <div style={{
          position: 'absolute', width: '200%', height: '200%',
          backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          opacity: 0.2
        }}></div>

        {/* Player Marker */}
        <div style={{
          width: '10px', height: '10px', background: '#4ade80', borderRadius: '50%',
          boxShadow: '0 0 5px #4ade80', zIndex: 2
        }}></div>

        <span style={{ position: 'absolute', bottom: '10px', fontSize: '10px', color: '#ccc' }}>Minimap</span>
      </div>

      {/* 3. Bottom Center: Action Bar (Skills & Items) */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '20px',
        alignItems: 'flex-end'
      }}>

        {/* Skills */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {skills.map((skill, idx) => (
            <div key={idx} style={{
              width: '48px', height: '48px',
              background: 'rgba(0,0,0,0.7)',
              border: '1px solid #555',
              borderRadius: '6px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{
                position: 'absolute', top: '2px', left: '4px',
                fontSize: '10px', color: '#ddd', fontWeight: 'bold'
              }}>{skill.key}</span>
              {skill.icon ? <skill.icon size={24} color={skill.cooldown > 0 ? '#555' : 'white'} /> : null}

              {/* Cooldown Overlay */}
              {skill.cooldown > 0 && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                  background: 'rgba(0,0,0,0.6)', borderRadius: '6px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 'bold', fontSize: '18px'
                }}>
                  {skill.cooldown}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Separator */}
        <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.2)' }}></div>

        {/* Items */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {items.map((item, idx) => (
            <div key={idx} style={{
              width: '40px', height: '40px',
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid #444',
              borderRadius: '6px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{
                position: 'absolute', top: '1px', left: '3px',
                fontSize: '9px', color: '#aaa'
              }}>{item.key}</span>

              {item.name === 'Potion' && <div style={{ width: '16px', height: '16px', background: '#ef4444', borderRadius: '50%' }}></div>}
              {item.name === 'Mana' && <div style={{ width: '16px', height: '16px', background: '#3b82f6', borderRadius: '50%' }}></div>}

              {item.count > 0 && (
                <span style={{
                  position: 'absolute', bottom: '1px', right: '3px',
                  fontSize: '10px', color: 'white', fontWeight: 'bold'
                }}>{item.count}</span>
              )}
            </div>
          ))}
        </div>

      </div>

    </div>
  );
};

export default GameOverlay;
