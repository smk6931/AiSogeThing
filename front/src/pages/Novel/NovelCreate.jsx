import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateNovel } from '../../api/novel';
import './NovelCreate.css';

const NovelCreate = () => {
  const [formData, setFormData] = useState({
    topic: '',
    character_count: 2,
    character_descriptions: '남자 주인공: 20대 후반, 차가운 인상\n여자 주인공: 20대 중반, 밝고 활발한 성격',
    scene_count: 4,
    script_length: 'medium'
  });
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'character_count' || name === 'scene_count' ? parseInt(value) : value
    }));
  };

  const handleGenerate = async () => {
    if (!formData.topic) {
      alert('스토리 주제를 입력해주세요');
      return;
    }

    setLoading(true);
    setProgress('📝 스토리 생성 중...');

    try {
      // Simulate progress updates
      setTimeout(() => setProgress('🎨 인물 디자인 중...'), 2000);
      setTimeout(() => setProgress('✂️ 씬 분할 중...'), 4000);
      setTimeout(() => setProgress('🖼️ 이미지 생성 중...'), 6000);
      setTimeout(() => setProgress('💾 데이터 저장 중...'), 10000);

      const data = await generateNovel(formData);
      navigate(`/novel/${data.id}`);
    } catch (err) {
      console.error(err);
      alert("웹툰 생성 실패: " + (err.response?.data?.detail || err.message));
      setProgress('');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="novel-create-page">
        <div className="loading-overlay">
          <div className="loading-box">
            <div className="loading-spinner"></div>
            <h2 className="loading-title">AI 웹툰 생성 중</h2>
            <p className="loading-text">{progress}</p>
            <div className="loading-bar">
              <div className="loading-bar-fill"></div>
            </div>
            <p className="loading-hint">잠시만 기다려주세요... (약 15-30초 소요)</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="novel-create-page">
      <h1 className="create-title">AI 웹툰 생성기</h1>

      <div className="create-form">
        {/* 스토리 주제 */}
        <div className="form-group">
          <label className="form-label">스토리 주제 *</label>
          <textarea
            name="topic"
            className="story-input"
            placeholder="예: 비 오는 날 우연히 만난 두 사람의 로맨스"
            value={formData.topic}
            onChange={handleChange}
            rows={3}
          />
        </div>

        {/* 인물 설정 */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">인물 수</label>
            <select
              name="character_count"
              className="form-select"
              value={formData.character_count}
              onChange={handleChange}
            >
              <option value={1}>1명 (독백)</option>
              <option value={2}>2명 (남녀)</option>
              <option value={3}>3명 (삼각관계)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">컷 개수</label>
            <select
              name="scene_count"
              className="form-select"
              value={formData.scene_count}
              onChange={handleChange}
            >
              <option value={3}>3컷 (짧음)</option>
              <option value={4}>4컷 (기본)</option>
              <option value={5}>5컷 (긴 이야기)</option>
            </select>
          </div>
        </div>

        {/* 인물 설명 */}
        <div className="form-group">
          <label className="form-label">인물 설명</label>
          <textarea
            name="character_descriptions"
            className="story-input"
            placeholder="각 인물의 외형, 성격 등을 설명해주세요"
            value={formData.character_descriptions}
            onChange={handleChange}
            rows={4}
          />
        </div>

        {/* 글 길이 */}
        <div className="form-group">
          <label className="form-label">글 길이</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="script_length"
                value="short"
                checked={formData.script_length === 'short'}
                onChange={handleChange}
              />
              짧게 (2-3줄)
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="script_length"
                value="medium"
                checked={formData.script_length === 'medium'}
                onChange={handleChange}
              />
              보통 (5-7줄)
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="script_length"
                value="long"
                checked={formData.script_length === 'long'}
                onChange={handleChange}
              />
              길게 (10줄+)
            </label>
          </div>
        </div>

        {/* 생성 버튼 */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="generate-btn"
        >
          웹툰 생성하기
        </button>
      </div>
    </div>
  );
};

export default NovelCreate;
