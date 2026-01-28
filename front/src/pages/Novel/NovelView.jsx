import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, BookText } from 'lucide-react';
import { getNovel } from '../../api/novel';
import './NovelView.css';

const NovelView = () => {
  const { id } = useParams();
  const [novel, setNovel] = useState(null);

  useEffect(() => {
    const fetchNovel = async () => {
      try {
        const data = await getNovel(id);
        setNovel(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchNovel();
  }, [id]);

  if (!novel) {
    return (
      <div className="novel-view-page loading-container">
        <div className="loading-spinner-small"></div>
        <p>Loading story...</p>
      </div>
    );
  }

  // Extract character info from character_descriptions if available
  const parseCharacters = (descriptions) => {
    if (!descriptions) return [];
    const lines = descriptions.split('\n').filter(l => l.trim());
    return lines.map((line, idx) => {
      const parts = line.split(':');
      return {
        name: parts[0]?.trim() || `Character ${idx + 1}`,
        description: parts[1]?.trim() || line
      };
    });
  };

  const characters = novel.character_descriptions ? parseCharacters(novel.character_descriptions) : [];

  return (
    <div className="novel-view-page">
      <div className="view-nav">
        <Link to="/novel" className="back-link">← Gallery</Link>
      </div>

      {/* Header Section */}
      <div className="view-header">
        <h1 className="view-title">{novel.title}</h1>
        <p className="view-date">{new Date(novel.created_at).toLocaleDateString('ko-KR')}</p>
      </div>

      {/* Synopsis Section */}
      {novel.script && (
        <div className="synopsis-section">
          <div className="section-header">
            <BookText size={20} />
            <h2>줄거리 소개</h2>
          </div>
          <p className="synopsis-text">{novel.script}</p>
        </div>
      )}

      {/* Characters Section */}
      {characters.length > 0 && (
        <div className="characters-section">
          <div className="section-header">
            <Users size={20} />
            <h2>등장인물</h2>
          </div>
          <div className="characters-grid">
            {characters.map((char, idx) => (
              <div key={idx} className="character-card">
                <div className="character-avatar">
                  {char.name.charAt(0)}
                </div>
                <div className="character-info">
                  <h3 className="character-name">{char.name}</h3>
                  <p className="character-desc">{char.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Story Content */}
      <div className="story-section">
        <div className="section-header">
          <h2>웹툰</h2>
        </div>

        <div className="cuts-container">
          {novel.cuts && novel.cuts.map((cut) => (
            <div key={cut.id} className="cut-item">
              <div className="cut-image-wrapper">
                <img
                  src={`http://localhost:8001${cut.image_path}`}
                  alt={`Scene ${cut.cut_order}`}
                  className="cut-img"
                  onError={(e) => {
                    e.target.src = "https://placehold.co/800x600/1a1a2e/ffffff?text=Loading...";
                  }}
                />
              </div>
              <div className="cut-content">
                <span className="cut-label">SCENE #{cut.cut_order}</span>
                <p className="cut-desc">{cut.scene_desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NovelView;
