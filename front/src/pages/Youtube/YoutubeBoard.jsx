import { useState, useEffect } from 'react';
import { Search, PlayCircle, Eye, Sparkles, XCircle, PlusCircle } from 'lucide-react';
import { searchYoutube, getPopularYoutube, logYoutubeVideo, getDatingYoutube, discoverDatingChannels, discoverInterest, getInterestYoutube, subscribeChannel, unsubscribeChannel } from '../../api/youtube';
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
  const [datingSubCategory, setDatingSubCategory] = useState('reality'); // 'reality' | 'sketch'
  const [customKeyword, setCustomKeyword] = useState('');
  const [interestChannels, setInterestChannels] = useState([]);
  const [selectedInterestChannel, setSelectedInterestChannel] = useState(null);

  const categories = [
    { id: null, name: '🔥 전체' },
    { id: 'dating', name: '💘 연애/코칭', special: true },
    { id: 'custom', name: '⭐ 내 관심사', special: true },
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
      } else if (categoryId === 'custom') {
        // 커스텀 관심사 (RSS)
        data = await getInterestYoutube(customKeyword || null);
        if (data.channels) setInterestChannels(data.channels);
      } else {
        data = await getPopularYoutube(categoryId);
      }

      console.log("Youtube Data:", data);

      if (data.items) {
        const shortsCount = data.items.filter(v => v.isShort).length;
        const videoCount = data.items.length - shortsCount;

        // 최신순 정렬 (Date 객체로 변환하여 비교)
        let sortedItems = [...data.items];
        sortedItems.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

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

  // 시간 포맷팅 (예: 2시간 전, 3일 전)
  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = (now - date) / 1000; // 초 단위

    if (diff < 60) return '방금 전';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
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
    const genreName = datingSubCategory === 'reality' ? "연애 코칭/예능" : "스케치 코미디";
    if (!confirm(`🤖 AI가 '${genreName}' 관련 인기 채널을 찾아냅니다.\n(API 100점 소모)\n\n계속하시겠습니까?`)) return;

    setLoading(true);
    try {
      const res = await discoverDatingChannels(datingSubCategory);
      if (res.error) {
        alert("오류 발생: " + res.error);
      } else {
        alert(`🎉 성공! ${res.added}개의 새로운 채널을 발견했습니다.\n이제 자동으로 목록에 추가됩니다.`);
        loadPopular('dating');
      }
    } catch (e) {
      alert("요청 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleDiscoverInterest = async () => {
    if (!customKeyword.trim()) return alert("키워드를 입력해주세요.");
    if (!confirm(`🤖 AI가 '${customKeyword}' 관련 인기 채널을 찾아냅니다.\n(API 100점 소모)\n\n계속하시겠습니까?`)) return;

    setLoading(true);
    try {
      const res = await discoverInterest(customKeyword);
      if (res.error) {
        alert("오류 발생: " + res.error);
      } else {
        alert(`🎉 성공! '${customKeyword}' 관련 ${res.added}개의 채널을 발견했습니다.\n이제 평생 무료(RSS)로 구독합니다.`);
        loadPopular('custom');
      }
    } catch (e) {
      alert("요청 실패");
    } finally {
      setLoading(false);
    }
  };


  const handleSubscribe = async (e, video) => {
    e.stopPropagation();
    if (!video.channelId) return alert("채널 정보를 알 수 없어 구독할 수 없습니다.");

    if (!confirm(`'${video.channelTitle}' 채널을 구독하시겠습니까?`)) return;

    try {
      await subscribeChannel(video.channelId, video.channelTitle);
      alert("✅ 구독 완료! '내 관심사' 탭이 곧 갱신됩니다.");
      if (selectedCategory === 'custom') loadPopular('custom');
    } catch (err) {
      alert("구독 실패: 이미 구독중이거나 오류 발생.");
    }
  };

  const handleUnsubscribe = async (e, channelId, channelName) => {
    e.stopPropagation();
    if (!confirm(`💔 '${channelName}' 구독을 취소하시겠습니까?`)) return;

    try {
      await unsubscribeChannel(channelId);
      alert("✅ 구독 취소 완료");
      if (selectedInterestChannel === channelId) setSelectedInterestChannel(null);
      loadPopular('custom');
    } catch (err) {
      alert("취소 실패");
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

  // 렌더링용: 현재 서브 카테고리에 맞는 채널만 필터링
  const filteredChannels = datingChannels.filter(ch => (ch.category || 'reality') === datingSubCategory);

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
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '12px', marginTop: '10px' }}>

            {/* 서브 카테고리 토글 */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '10px' }}>
              <button
                className={`category-chip ${datingSubCategory === 'reality' ? 'active' : ''}`}
                onClick={() => { setDatingSubCategory('reality'); setSelectedDatingChannel(null); }}
                style={{ borderRadius: '20px', padding: '6px 16px' }}
              >
                💑 연애 예능/코칭
              </button>
              <button
                className={`category-chip ${datingSubCategory === 'sketch' ? 'active' : ''}`}
                onClick={() => { setDatingSubCategory('sketch'); setSelectedDatingChannel(null); }}
                style={{ borderRadius: '20px', padding: '6px 16px' }}
              >
                🎭 스케치 코미디
              </button>
            </div>

            {/* 채널 리스트 & AI 버튼 */}
            <div className="category-control-row" style={{ overflowX: 'auto', display: 'flex', gap: '8px', paddingBottom: '5px' }}>

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
                  gap: '4px',
                  whiteSpace: 'nowrap'
                }}
              >
                <Sparkles size={14} /> 채널 발굴 (+100점)
              </button>

              <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)', margin: '0 4px' }}></div>

              <button
                className={`category-chip ${selectedDatingChannel === null ? 'active' : ''}`}
                onClick={() => setSelectedDatingChannel(null)}
                style={{ fontSize: '0.8rem', padding: '4px 12px', whiteSpace: 'nowrap' }}
              >
                전체 보기
              </button>

              {filteredChannels.length === 0 && (
                <span style={{ color: '#999', fontSize: '0.8rem', padding: '6px' }}>채널이 없습니다. 발굴해보세요!</span>
              )}

              {filteredChannels.map(ch => (
                <button
                  key={ch.id}
                  className={`category-chip ${selectedDatingChannel === ch.id ? 'active' : ''}`}
                  onClick={() => setSelectedDatingChannel(ch.id)}
                  style={{ fontSize: '0.8rem', padding: '4px 12px', whiteSpace: 'nowrap' }}
                >
                  {ch.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedCategory === 'custom' && (
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px', marginTop: '10px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '8px', color: '#ffd700' }}>⭐ AI 나만의 채널 큐레이터</h3>
            <p style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '12px' }}>
              관심있는 키워드(예: 주식, 캠핑, 요리)를 입력하면 AI가 관련 유튜버를 찾아내어<br />
              <b>실시간 RSS 피드(무료)</b>를 생성해줍니다.
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="관심사 입력 (예: EPL 축구)"
                value={customKeyword}
                onChange={(e) => setCustomKeyword(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: '150px',
                  padding: '8px 12px',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white'
                }}
              />
              <button
                onClick={handleDiscoverInterest}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  background: 'linear-gradient(45deg, #ff9966, #ff5e62)',
                  border: 'none',
                  color: 'white',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer'
                }}
              >
                <Sparkles size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                채널 발굴
              </button>
            </div>

            {interestChannels.length > 0 && (
              <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
                <div style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '8px' }}>📺 발굴된 채널 ({interestChannels.length})</div>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                  <button
                    className={`category-chip ${selectedInterestChannel === null ? 'active' : ''}`}
                    onClick={() => setSelectedInterestChannel(null)}
                    style={{ fontSize: '0.8rem', padding: '4px 12px', whiteSpace: 'nowrap' }}
                  >
                    전체
                  </button>
                  {interestChannels.map(ch => (
                    <div key={ch.id} style={{ position: 'relative', display: 'inline-block' }}>
                      <button
                        className={`category-chip ${selectedInterestChannel === ch.id ? 'active' : ''}`}
                        onClick={() => setSelectedInterestChannel(ch.id)}
                        style={{ fontSize: '0.8rem', padding: '4px 28px 4px 12px', whiteSpace: 'nowrap' }}
                      >
                        {ch.name}
                      </button>
                      <XCircle
                        size={14}
                        style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', opacity: 0.7 }}
                        onClick={(e) => handleUnsubscribe(e, ch.id, ch.name)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
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
              if (selectedCategory === 'dating') {
                // 1. 서브 카테고리 필터 (영상 태그 vs 현재 탭)
                const currentSub = datingSubCategory;
                const videoCategory = v.category || 'reality';
                if (videoCategory !== currentSub) return false;

                // 2. 특정 채널 선택 필터
                if (selectedDatingChannel) {
                  const targetName = datingChannels.find(c => c.id === selectedDatingChannel)?.name;
                  return v.channelTitle === targetName;
                }
              }

              if (selectedCategory === 'custom') {
                if (selectedInterestChannel) {
                  // ID로 정확하게 비교 (데이터에 channelId가 포함됨)
                  return v.channelId === selectedInterestChannel;
                }
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span className="channel-name">{video.channelTitle}</span>
                      {/* 구독하지 않은 채널이면 + 버튼 표시 (단, interestChannels가 로드된 상태여야 함) */}
                      {selectedCategory === 'custom' && !interestChannels.some(ch => ch.name === video.channelTitle) && (
                        <PlusCircle
                          size={14}
                          color="#4cd137"
                          style={{ cursor: 'pointer' }}
                          onClick={(e) => handleSubscribe(e, video)}
                        />
                      )}
                      {/* 검색 탭 등 다른 곳에서도 구독 가능하게 확장 가능 */}
                      {selectedCategory !== 'custom' && selectedCategory !== 'dating' && !interestChannels.some(ch => ch.name === video.channelTitle) && (
                        <PlusCircle
                          size={14}
                          color="#4cd137"
                          style={{ cursor: 'pointer' }}
                          onClick={(e) => handleSubscribe(e, video)}
                        />
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                      {video.viewCount && (
                        <span className="view-count">
                          <Eye size={12} style={{ marginRight: '4px' }} />
                          {formatViewCount(video.viewCount)}
                        </span>
                      )}
                      <span style={{ fontSize: '0.7rem', color: '#888' }}>
                        {formatTimeAgo(video.publishedAt)}
                      </span>
                    </div>
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
