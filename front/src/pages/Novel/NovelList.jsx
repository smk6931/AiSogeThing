import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Image as ImageIcon, Info, BookOpen } from 'lucide-react';
import { listNovels } from '../../api/novel';
import client from '../../api/client'; // Import client for baseURL
import './NovelList.css';

const NovelList = () => {
  const [novels, setNovels] = useState([]);
  const [loading, setLoading] = useState(true);

  // Auth Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Password for admin access (Simple hardcoded for demo)
  const ADMIN_PASSWORD = "asd789";

  useEffect(() => {
    fetchNovels();
  }, []);

  const fetchNovels = async () => {
    try {
      const data = await listNovels();
      if (Array.isArray(data)) {
        setNovels(data);
      } else {
        console.warn("Invalid novels data:", data);
        setNovels([]);
      }
    } catch (err) {
      console.error(err);
      setNovels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClick = (e) => {
    e.preventDefault();
    setShowAuthModal(true);
  };

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setShowAuthModal(false);
      setPassword('');
      window.location.href = "/novel/create";
    } else {
      setErrorMsg("관리자 암호가 일치하지 않습니다.");
    }
  };

  return (
    <div className="novel-list-page">
      {/* Header with Title and Buttons side-by-side */}
      <div className="novel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 className="novel-title">AI Webtoon Gallery</h1>

          <Link to="#" onClick={handleCreateClick} className="create-btn" title="Create New Webtoon">
            <Plus size={24} />
          </Link>

          <Link to="/novel/portfolio" className="portfolio-link" style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '14px',
            padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)',
            transition: 'all 0.2s'
          }}>
            <Info size={16} />
            <span>About Project</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner-small"></div>
        </div>
      ) : novels.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={48} className="empty-icon" />
          <p>아직 생성된 웹툰이 없습니다.</p>
          <p>새로운 이야기를 만들어보세요!</p>
        </div>
      ) : (
        <div className="novel-grid">
          {novels.map((novel) => (
            <Link to={`/novel/${novel.id}`} key={novel.id} className="novel-card">
              <div className="card-thumbnail">
                {novel.thumbnail_image ? (
                  <img
                    src={`${client.defaults.baseURL}${novel.thumbnail_image}`}
                    alt={novel.title}
                    loading="lazy"
                  />
                ) : (
                  <div className="thumbnail-placeholder">
                    <ImageIcon size={32} />
                  </div>
                )}
                <div className="thumbnail-overlay">
                  <div className="card-content">
                    <h3 className="card-title">{novel.title || "제목 없음"}</h3>
                    <p className="card-date">{new Date(novel.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                {(!novel.thumbnail_image || !novel.script) && <span className="status-badge">제작 중</span>}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="auth-modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="auth-modal-title">관리자 확인</h3>
            <form onSubmit={handleAuthSubmit}>
              <input
                type="password"
                className="auth-input"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              {errorMsg && <p className="auth-error-msg">{errorMsg}</p>}
              <button type="submit" className="auth-submit-btn">확인</button>
            </form>
            <button className="auth-close-btn" onClick={() => setShowAuthModal(false)}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NovelList;
