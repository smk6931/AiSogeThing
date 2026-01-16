import { useState, useEffect } from 'react';
import { Search, PlayCircle, Eye, Sparkles } from 'lucide-react';
import { searchYoutube, getPopularYoutube, logYoutubeVideo, getDatingYoutube, discoverDatingChannels } from '../../api/youtube';
import YoutubePlayer from './YoutubePlayer';
import ApiInfo from '../../components/common/ApiInfo';
import './YoutubeBoard.css';

export default function YoutubeBoard() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [quota, setQuota] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [hideShorts, setHideShorts] = useState(false);
  const [datingChannels, setDatingChannels] = useState([]);
  const [selectedDatingChannel, setSelectedDatingChannel] = useState(null);

  const categories = [
    { id: null, name: '🔥 전체' },
    { id: 'dating', name: '💘 연애/코칭', special: true },
    { id: '1', name: '🎬 애니/영화' },
    { id: '2', name: '🚗 자동차' },
    { id: '10', name: '🎵 음악' },
    { id: '15', name: '🐶 동물' },
    { id: '17', name: '⚽ 스포츠' },
    { id: '19', name: '✈️ 여행' },
    { id: '20', name: '🎮 게임' },
    { id: '22', name: '📷 일상' },
    { id: '23', name: '🤣 코미디' },
    { id: '24', name: '📺 엔터' },
    { id: '25', name: '📰 뉴스' },
    { id: '26', name: '💄 뷰티/패션' },
    { id: '27', name: '📚 교육' },
    { id: '28', name: '🧪 과학/기술' },
    { id: '29', name: '🤝 사회/봉사' },
  ];

  useEffect(() => {
    loadPopular(null);
  }, []);

  const loadPopular = async (categoryId) => {
    setLoading(true);
    setSelectedCategory(categoryId);
    setKeyword('');
    setSelectedDatingChannel(null);

    try {
      let data;

      if (categoryId === 'dating') {
        data = await getDatingYoutube();
        if (data.channels) setDatingChannels(data.channels);
      } else {
        data = await getPopularYoutube(categoryId);
      }

      console.log("Youtube Data:", data);

      if (data.items) {
        const shortsCount = data.items.filter(v => v.isShort).length;
        const videoCount = data.items.length - shortsCount;

        let sortedItems = [...data.items];

        if (shortsCount > videoCount) {
          sortedItems.sort((a, b) => (b.isShort === a.isShort) ? 0 : b.isShort ? 1 : -1);
        } else {
          sortedItems.sort((a, b) => (b.isShort === a.isShort) ? 0 : a.isShort ? 1 : -1);
        }

        setVideos(sortedItems);
        if (data.meta) setQuota(data.meta);
      } else if (data.error) {
        alert("영상 불러오기 실패: " + data.error);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setSelectedCategory('search');

    try {
      const data = await searchYoutube(keyword);
      if (data.items) {
        setVideos(data.items);
        if (data.meta) setQuota(data.meta);
      } else if (data.error) {
        alert("검색 실패: " + data.error);
      }
    } catch (error) {
      alert("검색 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDiscover = async () => {
    if (!confirm("🤖 AI가 YouTube를 탐색하여 새로운 '연애' 관련 인기 채널을 찾아냅니다.\n(API 100점 소모)\n\n계속하시겠습니까?")) return;

    setLoading(true);
    try {
      const res = await discoverDatingChannels();
      if (res.error) {
        alert("오류 발생: " + res.error);
      } else {
        alert(`🎉 성공! ${res.added}개의 새로운 채널을 발견했습니다.\n이제 자동으로 목록에 추가됩니다.`);
        loadPopular('dating'); // 목록 새로고침
      }
    } catch (e) {
      alert("요청 실패");
    } finally {
      setLoading(false);
    }
  };

  const formatViewCount = (count) => {
    if (!count) return '';
    const num = Number(count);
    if (isNaN(num)) return '';
    if (num >= 100000000) return (num / 100000000).toFixed(1) + '억회';
    if (num >= 10000) return (num / 10000).toFixed(1) + '만회';
    return num.toLocaleString() + '회';
  };

  return (
    <div className="youtube-board">
      <div className="youtube-header">
        <h2>🎵 Youtube Lounge</h2>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
          <ApiInfo
            name="YouTube API"
            remaining={quota?.remaining}
            limit={quota?.limit || 10000}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <button
            onClick={() => setHideShorts(!hideShorts)}
            className="category-chip"
            style={{
              background: hideShorts ? '#ff0000' : 'rgba(255,255,255,0.05)',
              border: hideShorts ? '1px solid #ff0000' : '1px solid rgba(255,255,255,0.2)',
              fontWeight: hideShorts ? 'bold' : 'normal'
            }}
          >
            {hideShorts ? '✅ 쇼츠 숨김 켜짐' : '🚫 쇼츠 숨기기'}
          </button>
        </div>

        <div className="category-tabs">
          {categories.map((cat) => (
            <button
              key={cat.id || 'all'}
              className={`category-chip ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => loadPopular(cat.id)}
              style={cat.special ? { border: '1px solid #ff69b4', color: '#ff69b4' } : {}}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {selectedCategory === 'dating' && (
          <div className="category-control-row" style={{ marginTop: '10px', overflowX: 'auto', display: 'flex', gap: '8px', paddingBottom: '5px' }}>

            {/* AI 채널 발굴 버튼 */}
            <button
              className="category-chip"
              onClick={handleDiscover}
              style={{
                fontSize: '0.8rem',
                padding: '4px 12px',
                background: 'linear-gradient(45deg, #6a11cb 0%, #2575fc 100%)',
                border: 'none',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Sparkles size={14} /> AI 채널 발굴 (+100점)
            </button>

            <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)', margin: '0 4px' }}></div>

            <button
              className={`category-chip ${selectedDatingChannel === null ? 'active' : ''}`}
              onClick={() => setSelectedDatingChannel(null)}
              style={{ fontSize: '0.8rem', padding: '4px 12px' }}
            >
              전체 보기
            </button>
            {datingChannels.map(ch => (
              <button
                key={ch.id}
                className={`category-chip ${selectedDatingChannel === ch.id ? 'active' : ''}`}
                onClick={() => setSelectedDatingChannel(ch.id)}
                style={{ fontSize: '0.8rem', padding: '4px 12px' }}
              >
                {ch.name}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSearch} className="youtube-search-bar" style={{ marginTop: '15px' }}>
          <input
            type="text"
            placeholder="좋아하는 영상 검색 (100점 소모)"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <button type="submit">
            <Search size={20} />
          </button>
        </form>
      </div>

      {loading ? (
        <div className="youtube-loading">
          <div className="loading-spinner"></div>
          <p>영상을 불러오는 중...</p>
        </div>
      ) : (
        <div className="video-grid">
          {videos
            .filter(v => !hideShorts || !v.isShort)
            .filter(v => {
              if (selectedCategory === 'dating' && selectedDatingChannel) {
                const targetName = datingChannels.find(c => c.id === selectedDatingChannel)?.name;
                return v.channelTitle === targetName;
              }
              return true;
            })
            .map((video) => (
              <div
                key={video.id}
                className="video-card glass-card"
                onClick={() => {
                  logYoutubeVideo(video);
                  setSelectedVideo(video.id);
                }}
              >
                <div className="thumbnail-wrapper">
                  <img src={video.thumbnail} alt={video.title} loading="lazy" />
                  {video.isShort && <div className="shorts-badge">Shorts</div>}
                  <div className="play-overlay">
                    <PlayCircle size={48} color="white" />
                  </div>
                </div>

                <div className="video-info">
                  <h3 className="video-title">{video.title}</h3>
                  <div className="video-meta">
                    <span className="channel-name">{video.channelTitle}</span>
                    {video.viewCount && (
                      <span className="view-count">
                        <Eye size={12} style={{ marginRight: '4px', display: 'inline-block' }} />
                        {formatViewCount(video.viewCount)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {selectedVideo && (
        <YoutubePlayer
          videoId={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </div>
  );
}
