import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
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

  if (!novel) return <div className="novel-view-page flex items-center justify-center">Loading...</div>;

  return (
    <div className="novel-view-page">
      <div className="view-nav">
        <Link to="/novel" className="back-link">← Gallery</Link>
      </div>

      <h1 className="view-title">{novel.title}</h1>

      <div className="cuts-container">
        {novel.cuts && novel.cuts.map((cut) => (
          <div key={cut.id} className="cut-item">
            <div className="cut-image-wrapper">
              <img
                src={cut.image_path}
                alt={`Cut ${cut.cut_order}`}
                className="cut-img"
                onError={(e) => {
                  e.target.src = "https://placehold.co/600x600/1a1a2e/ffffff?text=Generating...";
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
  );
};

export default NovelView;
