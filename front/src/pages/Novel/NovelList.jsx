import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client'; // axios client
import { PlusCircle, BookOpen } from 'lucide-react';
import './NovelList.css';

const NovelList = () => {
  const [novels, setNovels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNovels = async () => {
      try {
        // client 사용 (baseURL 설정됨)
        const res = await client.get('/novel/');
        setNovels(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNovels();
  }, []);

  return (
    <div className="novel-list-page">
      <div className="novel-header">
        <h1 className="novel-title">AI Webtoon Gallery</h1>
        <Link to="/novel/create" className="create-btn">
          <PlusCircle size={28} />
        </Link>
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
                <div className="thumbnail-overlay"></div>
                <BookOpen className="card-icon" size={32} />
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
    </div>
  );
};

export default NovelList;
