import { useState, useEffect } from 'react';
import { Eye, Heart, Target, X } from 'lucide-react';
import userApi from '../api/user';
import ChannelVideoModal from './ChannelVideoModal';
import './UserProfile.css';

export default function UserProfile({ userId, onClose }) {
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [activeTab, setActiveTab] = useState('history'); // 'history' | 'subscriptions' | 'keywords'
  const [loading, setLoading] = useState(true);

  // 선택된 채널 (모달용)
  const [selectedChannel, setSelectedChannel] = useState(null);

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  const loadUserProfile = async () => {
    setLoading(true);
    try {
      // 병렬로 데이터 로드
      const [profileRes, historyRes, subsRes] = await Promise.all([
        userApi.getUserProfile(userId),
        userApi.getUserHistory(userId),
        userApi.getUserSubscriptions(userId)
      ]);

      setProfile(profileRes.data);
      setHistory(historyRes.data.history || []);
      setSubscriptions(subsRes.data.channels || []);
    } catch (error) {
      console.error("프로필 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-modal">
        <div className="profile-container">
          <div className="loading-spinner"></div>
          <p>프로필 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-modal">
        <div className="profile-container">
          <p>사용자를 찾을 수 없습니다.</p>
          <button onClick={onClose}>닫기</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="profile-modal" onClick={onClose}>
        <div className="profile-container" onClick={(e) => e.stopPropagation()}>
          {/* 닫기 버튼 */}
          <button
            className="profile-close-btn"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#fff',
              zIndex: 10
            }}
          >
            <X size={24} />
          </button>

          {/* 프로필 헤더 */}
          <div className="profile-header" style={{
            textAlign: 'center',
            padding: '40px 20px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(45deg, #6c5ce7, #a29bfe)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              margin: '0 auto 10px',
              color: 'white'
            }}>
              {profile.nickname ? profile.nickname[0].toUpperCase() : '?'}
            </div>
            <h2 style={{ margin: '10px 0', color: '#fff' }}>{profile.nickname}</h2>
            <p style={{ color: '#888', fontSize: '0.9rem' }}>
              가입: {new Date(profile.created_at).toLocaleDateString()}
            </p>
          </div>

          {/* 탭 네비게이션 */}
          <div className="profile-tabs" style={{
            display: 'flex',
            justifyContent: 'space-around',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            padding: '10px 0'
          }}>
            <button
              className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
              style={{
                flex: 1,
                padding: '10px',
                background: activeTab === 'history' ? 'rgba(108,92,231,0.2)' : 'transparent',
                border: 'none',
                color: activeTab === 'history' ? '#6c5ce7' : '#aaa',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Eye size={18} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
              시청 기록
            </button>
            <button
              className={`tab-btn ${activeTab === 'subscriptions' ? 'active' : ''}`}
              onClick={() => setActiveTab('subscriptions')}
              style={{
                flex: 1,
                padding: '10px',
                background: activeTab === 'subscriptions' ? 'rgba(108,92,231,0.2)' : 'transparent',
                border: 'none',
                color: activeTab === 'subscriptions' ? '#6c5ce7' : '#aaa',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Heart size={18} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
              구독 채널
            </button>
            <button
              className={`tab-btn ${activeTab === 'keywords' ? 'active' : ''}`}
              onClick={() => setActiveTab('keywords')}
              style={{
                flex: 1,
                padding: '10px',
                background: activeTab === 'keywords' ? 'rgba(108,92,231,0.2)' : 'transparent',
                border: 'none',
                color: activeTab === 'keywords' ? '#6c5ce7' : '#aaa',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Target size={18} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
              취향 분석
            </button>
          </div>

          {/* 탭 컨텐츠 */}
          <div className="profile-content" style={{
            padding: '20px',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {activeTab === 'history' && (
              <div className="history-list">
                {history.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#888' }}>시청 기록이 없습니다.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {history.map((item, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        gap: '10px',
                        background: 'rgba(255,255,255,0.05)',
                        padding: '10px',
                        borderRadius: '8px'
                      }}>
                        <img
                          src={item.thumbnail_url}
                          alt={item.title}
                          style={{ width: '120px', height: '68px', borderRadius: '4px', objectFit: 'cover' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '5px' }}>
                            {item.title}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#888' }}>
                            {item.channel_title} • {new Date(item.viewed_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'subscriptions' && (
              <div className="subscriptions-list">
                {subscriptions.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#888' }}>구독 채널이 없습니다.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                    {subscriptions.map((ch, idx) => (
                      <div
                        key={idx}
                        className="subscription-item-card"
                        onClick={() => setSelectedChannel({ id: ch.channel_id, name: ch.name })}
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          padding: '10px',
                          borderRadius: '8px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '5px' }}>
                          {ch.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#888' }}>
                          {new Date(ch.subscribed_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'keywords' && (
              <div className="keywords-section" style={{ textAlign: 'center', padding: '40px 20px' }}>
                <Target size={48} color="#888" style={{ marginBottom: '15px' }} />
                <p style={{ color: '#888', fontSize: '0.9rem' }}>
                  AI 취향 분석 기능은 곧 추가될 예정입니다.
                </p>
                <p style={{ color: '#666', fontSize: '0.75rem', marginTop: '10px' }}>
                  구독 채널과 시청 기록을 기반으로<br />
                  이 사용자의 관심사와 취향을 분석해드립니다.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 채널 비디오 모달 (UserProfile 모달 위에 뜸) */}
      {selectedChannel && (
        <ChannelVideoModal
          channelId={selectedChannel.id}
          channelName={selectedChannel.name}
          onClose={() => setSelectedChannel(null)}
        />
      )}
    </>
  );
}
