import { useState } from 'react';
import { Settings, Grid, Heart, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import AuthModal from '../../components/common/AuthModal'; // 로그인 모달 필요 시 사용
import './MyPage.css';

export default function MyPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('feed');
  const [showLoginModal, setShowLoginModal] = useState(false);

  // 더미 데이터 (나중에 API 연동)
  const [posts] = useState([
    { id: 1, image: 'https://via.placeholder.com/300/2a2a2a', likes: 45 },
    { id: 2, image: 'https://via.placeholder.com/300/333333', likes: 32 },
    { id: 3, image: 'https://via.placeholder.com/300/1a1a1a', likes: 67 },
  ]);

  // 비로그인 상태 처리
  if (!user) {
    return (
      <div className="mypage">
        <div className="mypage__container" style={{ justifyContent: 'center', height: '80vh' }}>
          <Card variant="glass" padding="large" className="mypage__login-card">
            <h2 className="mypage__login-title">로그인이 필요해요 🔒</h2>
            <p className="mypage__login-desc">나만의 프로필을 만들고 활동해보세요!</p>
            <Button variant="primary" onClick={() => setShowLoginModal(true)}>
              로그인 / 회원가입
            </Button>
          </Card>
          <AuthModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
        </div>
      </div>
    );
  }

  // 아바타 생성
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nickname)}&background=667eea&color=fff&size=128`;

  return (
    <div className="mypage">
      <div className="mypage__container">
        <Card variant="glass" padding="large" className="mypage__profile">
          <div className="mypage__profile-header">
            <img
              src={avatarUrl}
              alt={user.nickname}
              className="mypage__profile-photo"
            />
            <button className="mypage__settings">
              <Settings size={20} />
            </button>
          </div>

          <h2 className="mypage__name">{user.nickname}</h2>
          <p className="mypage__email">@{user.email.split('@')[0]}</p>
          <p className="mypage__bio">아직 소개가 없습니다. 프로필을 꾸며보세요! ✨</p>

          <div className="mypage__stats">
            <div className="mypage__stat">
              <div className="mypage__stat-value">0</div>
              <div className="mypage__stat-label">게시물</div>
            </div>
            <div className="mypage__stat">
              <div className="mypage__stat-value">0</div>
              <div className="mypage__stat-label">매칭</div>
            </div>
            <div className="mypage__stat">
              <div className="mypage__stat-value">0</div>
              <div className="mypage__stat-label">좋아요</div>
            </div>
          </div>

          <div className="mypage__actions">
            <Button variant="outline" fullWidth icon={<LogOut size={18} />} onClick={logout}>
              로그아웃
            </Button>
          </div>
        </Card>

        {/* 탭 영역 (디자인 유지) */}
        <div className="mypage__tabs">
          <button
            className={`mypage__tab ${activeTab === 'feed' ? 'active' : ''}`}
            onClick={() => setActiveTab('feed')}
          >
            <Grid size={20} />
            <span>피드</span>
          </button>
          <button
            className={`mypage__tab ${activeTab === 'liked' ? 'active' : ''}`}
            onClick={() => setActiveTab('liked')}
          >
            <Heart size={20} />
            <span>좋아요</span>
          </button>
        </div>

        <div className="mypage__grid">
          {posts.map((post) => (
            <div key={post.id} className="mypage__post">
              <img src={post.image} alt="" className="mypage__post-image" />
              <div className="mypage__post-overlay">
                <Heart size={20} />
                <span>{post.likes}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
