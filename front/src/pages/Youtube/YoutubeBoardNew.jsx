import React, { useState, useEffect } from 'react';
import { Video, List, Search, Filter, TrendingUp, Calendar, Tag, Sparkles, ChevronDown, ChevronUp, Globe, Download, Check, Loader } from 'lucide-react';
import { getVideosFeed, getChannelsList, subscribeChannel, unsubscribeChannel, getLiveVideos } from '../../api/channelsApi';
import { discoverInterest, getAdhocRssVideos } from '../../api/youtube';
import client from '../../api/client';
import YoutubePlayer from './YoutubePlayer';
import './YoutubeBoardNew.css';

export default function YoutubeBoard() {
  const [activeTab, setActiveTab] = useState('videos'); // 'videos' | 'channels'
  const [selectedVideo, setSelectedVideo] = useState(null);

  return (
    <div className="youtube-main-container">
      {/* Tab Switcher */}
      <div className="main-tab-switcher">
        <button
          className={`main-tab ${activeTab === 'videos' ? 'active' : ''}`}
          onClick={() => setActiveTab('videos')}
        >
          <Video size={20} />
          영상 보기
        </button>
        <button
          className={`main-tab ${activeTab === 'channels' ? 'active' : ''}`}
          onClick={() => setActiveTab('channels')}
        >
          <List size={20} />
          채널 관리
        </button>
        <button
          className={`main-tab ${activeTab === 'explorer' ? 'active' : ''}`}
          onClick={() => setActiveTab('explorer')}
        >
          <Globe size={20} />
          API 탐색
        </button>
      </div>

      <div className="main-content-area">
        {activeTab === 'videos' ? (
          <VideoBrowser onVideoClick={setSelectedVideo} />
        ) : activeTab === 'channels' ? (
          <ChannelManager />
        ) : (
          <ApiExplorer onVideoClick={setSelectedVideo} />
        )}
      </div>

      {/* Video Player Modal */}
      {selectedVideo && (
        <div className="player-modal-overlay" onClick={() => setSelectedVideo(null)}>
          <div className="player-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedVideo(null)}>×</button>
            <YoutubePlayer video={selectedVideo} />
          </div>
        </div>
      )}
    </div>
  );
}

// ========== Section 1: 영상 브라우저 ==========
function VideoBrowser({ onVideoClick }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [country, setCountry] = useState('');
  const [category, setCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadVideos();
  }, [sortBy, country, category]);

  const loadVideos = async () => {
    setLoading(true);
    try {
      const data = await getVideosFeed({ sort_by: sortBy, country, category, limit: 50 });
      setVideos(data.videos || []);
    } catch (error) {
      console.error('Failed to load videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVideos = searchTerm
    ? videos.filter(v => v.title?.toLowerCase().includes(searchTerm.toLowerCase()))
    : videos;

  return (
    <div className="video-browser-section">
      {/* Controls */}
      <div className="browser-controls">
        <div className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="영상 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filters-row">
          <div className="sort-buttons">
            <button
              className={`sort-btn ${sortBy === 'newest' ? 'active' : ''}`}
              onClick={() => setSortBy('newest')}
            >
              <Calendar size={16} />
              최신순
            </button>
            <button
              className={`sort-btn ${sortBy === 'popular' ? 'active' : ''}`}
              onClick={() => setSortBy('popular')}
            >
              <TrendingUp size={16} />
              인기순
            </button>
          </div>

          <select value={country} onChange={(e) => setCountry(e.target.value)} className="filter-select">
            <option value="">모든 국가</option>
            <option value="KR">🇰🇷 한국</option>
            <option value="US">🇺🇸 미국</option>
            <option value="JP">🇯🇵 일본</option>
          </select>

          <select value={category} onChange={(e) => setCategory(e.target.value)} className="filter-select">
            <option value="">모든 장르</option>
            <option value="10">🎵 음악</option>
            <option value="20">🎮 게임</option>
            <option value="24">📺 엔터</option>
            <option value="17">⚽ 스포츠</option>
          </select>
        </div>
      </div>

      {/* Video Grid */}
      <div className="video-grid-container">
        {loading ? (
          <div className="loading-msg">영상을 불러오는 중...</div>
        ) : filteredVideos.length === 0 ? (
          <div className="empty-msg">검색 결과가 없습니다 🔍</div>
        ) : (
          <div className="video-grid">
            {filteredVideos.map((video) => (
              <div key={video.id} className="video-card-item" onClick={() => onVideoClick(video)}>
                <div className="video-thumb">
                  <img src={video.thumbnail} alt={video.title} />
                  {video.isShort && <span className="shorts-badge">Shorts</span>}
                </div>
                <div className="video-details">
                  <h4>{video.title}</h4>
                  <p className="channel-name">{video.channelTitle}</p>
                  <div className="video-stats-row">
                    <span>조회수 {formatViews(video.viewCount)}</span>
                    <span>{formatDate(video.publishedAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ========== Section 2: 채널 매니저 (Enhanced with Accordion) ==========
function ChannelManager() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [discoveryKeyword, setDiscoveryKeyword] = useState('');
  const [expandedChannel, setExpandedChannel] = useState(null); // 확장된 채널 ID
  const [channelVideos, setChannelVideos] = useState({}); // {channelId: [videos]}

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    setLoading(true);
    try {
      const data = await getChannelsList({ limit: 100 });
      setChannels(data.channels || []);
    } catch (error) {
      console.error('Failed to load channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscovery = async () => {
    if (!discoveryKeyword.trim()) return alert('키워드를 입력해주세요');

    if (!confirm(`AI가 "${discoveryKeyword}" 관련 채널을 찾습니다.\n(API 100점 소모)`)) return;

    setLoading(true);
    try {
      const res = await discoverInterest(discoveryKeyword);
      if (res.channels) {
        alert(`✨ ${res.channels.length}개 채널 발굴 완료!`);
        loadChannels(); // Refresh
      }
    } catch (error) {
      alert('발굴 실패');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (channel) => {
    try {
      if (channel.is_subscribed) {
        await unsubscribeChannel(channel.channel_id);
      } else {
        await subscribeChannel(channel.channel_id, channel.name);
      }
      loadChannels();
    } catch (error) {
      console.error('Subscribe failed:', error);
    }
  };

  const handleChannelToggle = async (channel) => {
    if (expandedChannel === channel.channel_id) {
      setExpandedChannel(null); // 닫기
    } else {
      setExpandedChannel(channel.channel_id); // 열기

      // 영상 로드 (RSS)
      if (!channelVideos[channel.channel_id]) {
        try {
          const result = await getAdhocRssVideos([{
            id: channel.channel_id,
            name: channel.name
          }]);
          setChannelVideos(prev => ({
            ...prev,
            [channel.channel_id]: result.items || []
          }));
        } catch (error) {
          console.error('Failed to load channel videos:', error);
        }
      }
    }
  };

  const filteredChannels = searchTerm
    ? channels.filter(c => c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.keywords?.toLowerCase().includes(searchTerm.toLowerCase()))
    : channels;

  return (
    <div className="channel-manager-section">
      {/* Discovery Panel */}
      <div className="discovery-panel">
        <div className="discovery-header">
          <Sparkles size={24} color="#ff6b6b" />
          <h3>AI 채널 발굴</h3>
        </div>
        <div className="discovery-input-group">
          <input
            type="text"
            placeholder="관심사 입력 (예: EPL 축구, 주식)"
            value={discoveryKeyword}
            onChange={(e) => setDiscoveryKeyword(e.target.value)}
          />
          <button onClick={handleDiscovery} disabled={loading}>
            {loading ? '검색중...' : '🔍 발굴'}
          </button>
        </div>
      </div>

      {/* Channel List */}
      <div className="channel-list-panel">
        <div className="channel-search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="채널 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="channel-accordion">
          {loading ? (
            <div className="loading-msg">채널 불러오는 중...</div>
          ) : filteredChannels.length === 0 ? (
            <div className="empty-msg">채널이 없습니다 📺</div>
          ) : (
            filteredChannels.map((channel) => (
              <div key={channel.channel_id} className="channel-accordion-item">
                {/* Channel Header */}
                <div className="channel-card-header" onClick={() => handleChannelToggle(channel)}>
                  {channel.thumbnail_url ? (
                    <img src={channel.thumbnail_url} alt={channel.name} className="channel-thumbnail" />
                  ) : (
                    <div className="channel-avatar-circle">
                      {channel.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="channel-info-box">
                    <h4>{channel.name}</h4>
                    {channel.category && (
                      <span className="cat-tag">
                        <Tag size={12} />
                        {channel.category}
                      </span>
                    )}
                    {channel.keywords && (
                      <div className="keywords-row">
                        {channel.keywords.split(',').slice(0, 3).map((kw, i) => (
                          <span key={i} className="kw-pill">#{kw.trim()}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    className={`sub-btn ${channel.is_subscribed ? 'subscribed' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSubscribe(channel);
                    }}
                  >
                    {channel.is_subscribed ? '✓' : '+'}
                  </button>

                  <button className="expand-btn">
                    {expandedChannel === channel.channel_id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>

                {/* Expanded Video List */}
                {expandedChannel === channel.channel_id && (
                  <div className="channel-videos-grid">
                    {channelVideos[channel.channel_id] ? (
                      channelVideos[channel.channel_id].length > 0 ? (
                        channelVideos[channel.channel_id].map((video) => (
                          <div key={video.id} className="channel-video-thumb">
                            <img src={video.thumbnail} alt={video.title} />
                            <div className="video-thumb-title">{video.title}</div>
                          </div>
                        ))
                      ) : (
                        <p className="no-videos-msg">영상이 없습니다</p>
                      )
                    ) : (
                      <p className="loading-videos-msg">영상을 불러오는 중...</p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ========== Section 3: API 탐색 (Live) ==========
function ApiExplorer({ onVideoClick }) {
  const [activeCountry, setActiveCountry] = useState('KR');
  const [activeCategory, setActiveCategory] = useState('');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [collecting, setCollecting] = useState(false);

  const countries = [
    { code: 'KR', name: '🇰🇷 한국' },
    { code: 'US', name: '🇺🇸 미국' },
    { code: 'JP', name: '🇯🇵 일본' },
    { code: 'TH', name: '🇹🇭 태국' },
    { code: 'VN', name: '🇻🇳 베트남' },
    { code: 'GB', name: '🇬🇧 영국' },
  ];

  const categories = [
    { id: '', name: '🔥 전체 인기' },
    { id: '10', name: '🎵 음악' },
    { id: '20', name: '🎮 게임' },
    { id: '17', name: '⚽ 스포츠' },
    { id: '24', name: '📺 엔터' },
    { id: '25', name: '📰 뉴스' },
    { id: '1', name: '🎬 애니/영화' },
  ];

  const handleFetch = async () => {
    setLoading(true);
    try {
      const result = await getLiveVideos({ country: activeCountry, category: activeCategory });
      setVideos(result.videos || []);
    } catch (error) {
      console.error(error);
      alert('API 호출 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleCollect = async () => {
    if (!confirm('이 목록의 영상들을 DB에 수집하시겠습니까? (Admin Only)')) return;

    setCollecting(true);
    try {
      await client.post('/api/youtube/admin/collect-one', {
        country: activeCountry,
        category: activeCategory || null
      });
      alert('✅ 수집 완료! "영상 보기" 탭에서 확인할 수 있습니다.');
    } catch (error) {
      console.error(error);
      alert('수집 실패');
    } finally {
      setCollecting(false);
    }
  };

  return (
    <div className="api-explorer-section">
      <div className="explorer-controls">
        <label>국가 선택</label>
        <div className="pill-group">
          {countries.map(c => (
            <button
              key={c.code}
              className={`pill-btn ${activeCountry === c.code ? 'active' : ''}`}
              onClick={() => setActiveCountry(c.code)}
            >
              {c.name}
            </button>
          ))}
        </div>

        <label style={{ marginTop: '16px' }}>카테고리 선택</label>
        <div className="pill-group">
          {categories.map(c => (
            <button
              key={c.id}
              className={`pill-btn ${activeCategory === c.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="action-row">
          <button className="primary-btn" onClick={handleFetch} disabled={loading}>
            {loading ? <Loader className="spin" /> : <Search size={18} />}
            실시간 탐색 (API)
          </button>

          {videos.length > 0 && (
            <button className="secondary-btn" onClick={handleCollect} disabled={collecting}>
              {collecting ? <Loader className="spin" /> : <Download size={18} />}
              DB 수집
            </button>
          )}
        </div>
      </div>

      <div className="video-grid-container">
        {loading ? (
          <div className="loading-msg">YouTube API 호출 중... 📡</div>
        ) : videos.length === 0 ? (
          <div className="empty-msg">조건을 선택하고 탐색해보세요!</div>
        ) : (
          <div className="video-grid">
            {videos.map((video) => (
              <div key={video.id} className="video-card-item" onClick={() => onVideoClick(video)}>
                <div className="video-thumb">
                  <img src={video.thumbnail} alt={video.title} />
                </div>
                <div className="video-details">
                  <h4>{video.title}</h4>
                  <p className="channel-name">{video.channelTitle}</p>
                  <div className="video-stats-row">
                    <span>조회수 {formatViews(video.viewCount)}</span>
                    <span style={{ color: '#ff6b6b' }}>Live API</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Helpers
function formatViews(count) {
  if (!count) return '정보 없음';
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  return `${Math.floor(diffDays / 30)}개월 전`;
}
