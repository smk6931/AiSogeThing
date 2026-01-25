
import React, { useState, useEffect } from 'react';
import { Download, Loader, Check, X, ShieldCheck } from 'lucide-react';
import client from '../api/client';

export default function GlobalCollector() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeCountry, setActiveCountry] = useState('KR');

  // 수집 완료된 항목들 (LocalStorage 관리)
  const [collectedItems, setCollectedItems] = useState(new Set());

  // 국가 목록 (한국인 관심 위주)
  const countries = [
    { code: 'KR', name: '🇰🇷 한국' },
    { code: 'US', name: '🇺🇸 미국' },
    { code: 'JP', name: '🇯🇵 일본' },
    { code: 'CA', name: '�� 캐나다' },
    { code: 'GB', name: '🇬🇧 영국' },
    { code: 'AU', name: '🇦🇺 호주' },
    { code: 'DE', name: '🇩🇪 독일' },
    { code: 'FR', name: '🇫🇷 프랑스' },
    { code: 'VN', name: '🇻🇳 베트남' },
    { code: 'TH', name: '🇹🇭 태국' },
    { code: 'TW', name: '�� 대만' },
  ];

  // 카테고리 목록 (유튜브 공식 ID 기준)
  const categories = [
    { id: null, name: '🔥 전체 인기' },
    { id: '10', name: '🎵 음악' },
    { id: '20', name: '🎮 게임' },
    { id: '24', name: '📺 엔터테인먼트' },
    { id: '23', name: '🤣 코미디' },
    { id: '17', name: '⚽ 스포츠' },
    { id: '25', name: '📰 뉴스/정치' },
    { id: '22', name: '✨ 인물/블로그' },
    { id: '1', name: '🎬 영화/애니' },
    { id: '26', name: '💄 스타일/뷰티' },
    { id: '27', name: '🏫 교육' },
    { id: '28', name: '🚀 과학기술' },
    { id: '15', name: '🐶 반려동물' },
    { id: '2', name: '🚗 자동차' },
    { id: '19', name: '✈️ 여행/이벤트' },
  ];

  // 로컬스토리지 키 생성 (날짜별 초기화)
  const getStorageKey = () => {
    const today = new Date().toISOString().split('T')[0];
    return `collected_v1_${today}`;
  };

  useEffect(() => {
    // 초기 로드 시 수집 목록 복원
    const key = getStorageKey();
    const saved = localStorage.getItem(key);
    if (saved) {
      setCollectedItems(new Set(JSON.parse(saved)));
    }
  }, []);

  const handleCollect = async (category) => {
    const itemKey = `${activeCountry}-${category.id}`;
    if (collectedItems.has(itemKey)) return;

    // confirm 제거 (빠른 수집 위해) - 혹은 옵션으로? 일단 유지하되 메시지 간소화
    // if (!confirm(`${activeCountry} - ${category.name} 수집?`)) return;

    setLoading(itemKey);
    try {
      await client.post('/api/youtube/admin/collect-one', {
        country: activeCountry,
        category: category.id || null
      });

      const key = getStorageKey();
      const newSet = new Set(collectedItems);
      newSet.add(itemKey);
      setCollectedItems(newSet);
      localStorage.setItem(key, JSON.stringify([...newSet]));

    } catch (error) {
      console.error(error);
      alert('요청 실패');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '90px',
          zIndex: 9999,
          background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '50px',
          padding: '12px 24px',
          boxShadow: '0 4px 15px rgba(255, 107, 107, 0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 'bold',
          fontSize: '1rem',
          transition: 'transform 0.2s',
          letterSpacing: '0.5px'
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Download size={20} />
        Admin Collect
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '80px',
      right: '20px',
      zIndex: 9999,
      background: 'rgba(30, 30, 46, 0.98)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: '20px',
      width: '600px', // 가로 대폭 확장
      maxHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
      color: 'white',
      overflow: 'hidden',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(0,0,0,0.2)'
      }}>
        <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700 }}>
          <ShieldCheck size={24} color="#FF6B6B" />
          글로벌 트렌드 수집기
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', padding: '5px' }}
        >
          <X size={24} />
        </button>
      </div>

      {/* Content Area (Scrollable) */}
      <div style={{ padding: '20px', overflowY: 'auto' }}>

        {/* Country Tabs */}
        <div style={{ marginBottom: '10px', fontSize: '0.9rem', color: '#bbb', fontWeight: 600 }}>📡 타겟 국가 선택</div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
          gap: '8px',
          marginBottom: '25px',
        }}>
          {countries.map(c => (
            <button
              key={c.code}
              onClick={() => setActiveCountry(c.code)}
              style={{
                padding: '10px',
                borderRadius: '12px',
                border: activeCountry === c.code ? '2px solid #FF6B6B' : '1px solid rgba(255,255,255,0.1)',
                background: activeCountry === c.code ? 'rgba(255, 107, 107, 0.15)' : 'rgba(255,255,255,0.03)',
                color: activeCountry === c.code ? '#FF6B6B' : '#888',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: activeCountry === c.code ? 'bold' : 'normal',
                transition: 'all 0.2s'
              }}
            >
              {c.name.split(' ')[0]} <span style={{ fontSize: '0.8em' }}>{c.code}</span>
            </button>
          ))}
        </div>

        {/* Categories Grid */}
        <div style={{ marginBottom: '10px', fontSize: '0.9rem', color: '#bbb', fontWeight: 600 }}>🎯 수집 카테고리</div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)', // 3열로 빽빽하게
          gap: '12px'
        }}>
          {categories.map(cat => {
            const itemKey = `${activeCountry}-${cat.id}`;
            const isCollected = collectedItems.has(itemKey);
            const isLoading = loading === itemKey;

            return (
              <button
                key={cat.id || 'all'}
                onClick={() => handleCollect(cat)}
                disabled={isCollected || loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '15px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isCollected
                    ? 'linear-gradient(135deg, rgba(46, 213, 115, 0.2), rgba(46, 213, 115, 0.1))'
                    : 'rgba(255,255,255,0.05)',
                  color: isCollected ? '#2ed573' : '#eee',
                  cursor: (isCollected || loading) ? 'default' : 'pointer',
                  opacity: (isCollected || loading) ? 0.7 : 1,
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseOver={(e) => !isCollected && !loading && (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                onMouseOut={(e) => !isCollected && !loading && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              >
                <span>{cat.name}</span>
                {isLoading ? (
                  <Loader size={18} className="spin" color="#FF6B6B" />
                ) : isCollected ? (
                  <Check size={18} />
                ) : (
                  <Download size={18} style={{ opacity: 0.3 }} />
                )}

                {/* 진행률 바 효과 (로딩 중일 때) */}
                {isLoading && (
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, height: '3px', background: '#FF6B6B',
                    width: '100%', animation: 'loadingBar 2s infinite ease-in-out'
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{
        padding: '15px',
        background: 'rgba(0,0,0,0.3)',
        fontSize: '0.8rem',
        color: '#666',
        textAlign: 'center',
        borderTop: '1px solid rgba(255,255,255,0.05)'
      }}>
        * 클릭 시 즉시 수집 시작 (평균 4 Unit 소모) · 수집 결과는 자동 저장됩니다.
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes loadingBar { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
      `}</style>
    </div>
  );
}
