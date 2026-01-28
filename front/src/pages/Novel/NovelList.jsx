import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, BookOpen } from 'lucide-react';
import { listNovels } from '../../api/novel';
import './NovelList.css';

const NovelList = () => {
  const [novels, setNovels] = useState([]);
  const [loading, setLoading] = useState(true);

  // Auth Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isCoolDown, setIsCoolDown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNovels = async () => {
      try {
        const data = await listNovels();
        setNovels(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNovels();
  }, []);

  const handleCreateClick = (e) => {
    e.preventDefault();
    setShowAuthModal(true);
    setErrorMsg('');
    setPassword('');
  };

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (isCoolDown) return;

    // Hardcoded Password Check (Demo Purpose)
    if (password === 'asd789') {
      setShowAuthModal(false);
      navigate('/novel/create');
    } else {
      setErrorMsg('Incorrect Password. Please wait 5s.');
      setIsCoolDown(true);
      setPassword('');
      // 5초 쿨다운
      setTimeout(() => {
        setIsCoolDown(false);
        setErrorMsg('');
      }, 5000);
    }
  };

  return (
    <div className="novel-list-page">
      <div className="novel-header">
        <h1 className="novel-title">AI Webtoon Gallery</h1>
        <button onClick={handleCreateClick} className="create-btn" title="Create New Story">
          <PlusCircle size={28} />
        </button>
      </div>

      {loading ? (
        <div className="empty-state">Loading stories...</div>
      ) : novels.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={48} className="empty-icon" />
          <p>No stories yet.</p>
          <p>Be the first to create one!</p>
        </div>
      ) : (
        <div className="novel-grid">
          {novels.map((novel) => (
            <Link key={novel.id} to={`/novel/${novel.id}`} className="novel-card">
              <div className="card-thumbnail">
                {novel.thumbnail_image ? (
                  <img
                    src={`http://localhost:8001${novel.thumbnail_image}`}
                    alt={novel.title}
                    className="thumbnail-img"
                  />
                ) : (
                  <>
                    <div className="thumbnail-overlay"></div>
                    <BookOpen className="card-icon" size={32} />
                  </>
                )}
              </div>
              <div className="card-content">
                <h3 className="card-title">{novel.title}</h3>
                <div className="card-desc">{novel.script}</div>
                <div className="card-date">
                  {new Date(novel.created_at).toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Password Modal */}
      {showAuthModal && (
        <div className="auth-modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="auth-modal-title">🔒 Admin Access</h3>
            <p style={{ fontSize: '12px', color: '#888', marginBottom: '16px' }}>
              AI Resource Control (Demo)
            </p>
            <form onSubmit={handleAuthSubmit}>
              <input
                type="password"
                className="auth-input"
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isCoolDown}
                autoFocus
              />
              {errorMsg && <div className="auth-error-msg">{errorMsg}</div>}
              <button
                type="submit"
                className="auth-submit-btn"
                disabled={isCoolDown || !password}
              >
                {isCoolDown ? 'Wait 5s...' : 'Enter'}
              </button>
            </form>
            <button
              className="auth-close-btn"
              onClick={() => setShowAuthModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NovelList;
