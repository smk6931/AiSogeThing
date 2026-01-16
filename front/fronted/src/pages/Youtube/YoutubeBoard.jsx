import { useState, useEffect } from 'react';
import { Search, PlayCircle, Eye } from 'lucide-react';
import { searchYoutube, getPopularYoutube, logYoutubeVideo } from '../../api/youtube';
import YoutubePlayer from './YoutubePlayer';
import ApiInfo from '../../components/common/ApiInfo'; // API 정보 컴포넌트 추가
import './YoutubeBoard.css';

export default function YoutubeBoard() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [quota, setQuota] = useState(null); // API 사용량 정보
  const [selectedCategory, setSelectedCategory] = useState(null); // 선택된 카테고리 (null=전체)

  // 카테고리 목록 정의 (전체 리스트)
  const categories = [
    { id: null, name: '🔥 전체' },
    { id: '10', name: '🎵 음악' },
    { id: '15', name: '🐶 동물' },
    { id: '20', name: '🎮 게임' },
    { id: '22', name: '📷 일상' },
    { id: '23', name: '🤣 코미디' },
    { id: '24', name: '📺 엔터' },
    { id: '17', name: '⚽ 스포츠' },
    { id: '1', name: '🎬 영화' },
    { id: '26', name: '💄 뷰티/패션' },
    { id: '2', name: '🚗 자동차' },
    { id: '28', name: '🧪 과학/기술' },
    { id: '19', name: '✈️ 여행' },
    { id: '25', name: '📰 뉴스' },
    { id: '27', name: '📚 교육' },
    { id: '29', name: '🤝 사회/봉사' },
  ];

  // 초기 로딩
  useEffect(() => {
    loadPopular(null);
  }, []);

  const loadPopular = async (categoryId) => {
    setLoading(true);
    setSelectedCategory(categoryId);
    setKeyword(''); // 카테고리 클릭 시 검색어 초기화

    try {
      // 카테고리 ID가 있으면 해당 카테고리 조회, 없으면 전체 인기 조회
      const data = await getPopularYoutube(categoryId);
      console.log("Youtube Data:", data);

      if (data.items) {
        setVideos(data.items);
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
    setSelectedCategory('search'); // 검색 모드로 상태 변경 (UI 하이라이트 해제용)

    try {
      const data = await searchYoutube(keyword);
      console.log("Search Data:", data);

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

  // 조회수 포매팅 (예: 12345 -> 1.2만회)
  const formatViewCount = (count) => {
    if (!count) return '';
    const num = Number(count);
    if (num >= 100000000) return (num / 100000000).toFixed(1) + '억회';
    if (num >= 10000) return (num / 10000).toFixed(1) + '만회';
    return num.toLocaleString() + '회';
  };

  return (
    <div className="youtube-board">
      <div className="youtube-header">
        <h2>🎵 Youtube Lounge</h2>

        {/* API 사용량 표시 */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
          <ApiInfo
            name="YouTube API"
            remaining={quota?.remaining}
            limit={quota?.limit || 10000}
          />
        </div>

        {/* 카테고리 탭 - 가로 스크롤 가능하게 처리 */}
        <div className="category-tabs">
          {categories.map((cat) => (
            <button
              key={cat.id || 'all'}
              className={`category-chip ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => loadPopular(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="youtube-search-bar">
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
          {videos.map((video) => (
            <div
              key={video.id}
              className="video-card glass-card"
              onClick={() => {
                logYoutubeVideo(video); // 클릭 로그 저장
                setSelectedVideo(video.id);
              }}
            >
              <div className="thumbnail-wrapper">
                <img src={video.thumbnail} alt={video.title} loading="lazy" />
                <div className="play-overlay">
                  <PlayCircle size={48} color="white" />
                </div>
                {/* 썸네일 우측 하단에 영상 길이 등 정보를 넣을 수도 있음 */}
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
