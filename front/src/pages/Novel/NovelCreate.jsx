import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client'; // axios client
import './NovelCreate.css';

const NovelCreate = () => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      const res = await client.post('/novel/generate', { topic });
      const novelId = res.data.id;
      navigate(`/novel/${novelId}`);
    } catch (err) {
      console.error(err);
      alert("Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="novel-create-page">
      <h1 className="create-title">Create Your AI Webtoon</h1>
      <div className="create-form">
        <textarea
          className="story-input"
          placeholder="Enter your romance story idea here... (e.g., A rainy day encounter at a Gangnam cafe)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <button
          onClick={handleGenerate}
          disabled={loading}
          className={`generate-btn ${loading ? 'loading-text' : ''}`}
        >
          {loading ? "Generating Story & Images..." : "Create Webtoon"}
        </button>
      </div>
    </div>
  );
};

export default NovelCreate;
