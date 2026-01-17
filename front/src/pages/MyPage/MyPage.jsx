import { useState } from 'react';
import { Settings, Grid, Heart, UserPlus } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import './MyPage.css';

export default function MyPage() {
  const [activeTab, setActiveTab] = useState('feed');

  const user = {
    name: '김소개',
    age: 28,
    photo: 'https://via.placeholder.com/120',
    bio: '음악과 영화를 사랑하는 개발자입니다 ✨',
    interests: ['🎵 인디음악', '🎬 영화', '☕️ 카페', '💻 개발'],
    stats: {
      posts: 24,
      matches: 12,
      likes: 156
    }
  };

  const [posts] = useState([
    { id: 1, image: 'https://via.placeholder.com/300', likes: 45 },
    { id: 2, image: 'https://via.placeholder.com/300', likes: 32 },
    { id: 3, image: 'https://via.placeholder.com/300', likes: 67 },
    { id: 4, image: 'https://via.placeholder.com/300', likes: 23 },
    { id: 5, image: 'https://via.placeholder.com/300', likes: 89 },
    { id: 6, image: 'https://via.placeholder.com/300', likes: 51 },
  ]);

  return (
    <div className="mypage">
      <div className="mypage__container">
        <Card variant="glass" padding="large" className="mypage__profile">
          <div className="mypage__profile-header">
            <img
              src={user.photo}
              alt={user.name}
              className="mypage__profile-photo"
            />
            <button className="mypage__settings">
              <Settings size={20} />
            </button>
          </div>

          <h2 className="mypage__name">{user.name}, {user.age}</h2>
          <p className="mypage__bio">{user.bio}</p>

          <div className="mypage__interests">
            {user.interests.map((interest, index) => (
              <span key={index} className="mypage__interest-tag">
                {interest}
              </span>
            ))}
          </div>

          <div className="mypage__stats">
            <div className="mypage__stat">
              <div className="mypage__stat-value">{user.stats.posts}</div>
              <div className="mypage__stat-label">게시물</div>
            </div>
            <div className="mypage__stat">
              <div className="mypage__stat-value">{user.stats.matches}</div>
              <div className="mypage__stat-label">매칭</div>
            </div>
            <div className="mypage__stat">
              <div className="mypage__stat-value">{user.stats.likes}</div>
              <div className="mypage__stat-label">좋아요</div>
            </div>
          </div>

          <Button variant="primary" fullWidth icon={<UserPlus size={18} />}>
            프로필 편집
          </Button>
        </Card>

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
