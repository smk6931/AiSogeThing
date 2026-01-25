import React, { useState, useEffect } from 'react';
import { Video, List, Search, Filter, TrendingUp, Calendar, Tag, ChevronDown, ChevronUp, UserPlus } from 'lucide-react';
import { getVideosFeed, getChannelsList, subscribeChannel, unsubscribeChannel } from '../../api/channelsApi';
import { getAdhocRssVideos } from '../../api/youtube';
import YoutubePlayer from './YoutubePlayer';
import GlobalCollector from '../../components/GlobalCollector';
import ChannelExplorer from './ChannelExplorer';
import './YoutubeBoardNew.css';

export default function YoutubeBoard() {
  const [activeTab, setActiveTab] = useState('videos');
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
          영상
        </button>
        <button
          className={`main-tab ${activeTab === 'channels' ? 'active' : ''}`}
          onClick={() => setActiveTab('channels')}
        >
          <List size={20} />
          채널
        </button>
      </div>

      <div className="main-content-area">
        {activeTab === 'videos' ? (
          <VideoBrowser onVideoClick={setSelectedVideo} />
        ) : (
          <ChannelExplorer onChannelClick={(ch) => console.log('Channel clicked:', ch)} />
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

      {/* Admin Collection Modal */}
      <GlobalCollector />
    </div>
  );
}

// ========== Section 1: 영상 브라우저 ==========
function VideoBrowser({ onVideoClick }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [country, setCountry] = useState('KR');
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

  const handleSubscribe = async (e, video) => {
    e.stopPropagation();
    try {
      const channelId = video.channelId || video.channel_id; // API 응답 필드 확인 (camel or snake)
      if (!channelId) return;

      await subscribeChannel(channelId, video.channelTitle);
      alert(`✅ "${video.channelTitle}" 채널을 구독했습니다!`);
    } catch (error) {
      console.error('Subscribe failed:', error);
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
            <option value="">🌍 모든 국가</option>
            <option value="KR">🇰🇷 한국</option>
            <option value="US">🇺🇸 미국</option>
            <option value="JP">🇯🇵 일본</option>
            <option value="CA">🇨🇦 캐나다</option>
            <option value="GB">🇬🇧 영국</option>
            <option value="AU">🇦🇺 호주</option>
            <option value="DE">🇩🇪 독일</option>
            <option value="FR">🇫🇷 프랑스</option>
            <option value="VN">🇻🇳 베트남</option>
            <option value="TH">🇹🇭 태국</option>
            <option value="TW">🇹🇼 대만</option>
          </select>

          <select value={category} onChange={(e) => setCategory(e.target.value)} className="filter-select">
            <option value="">🔥 모든 장르</option>
            <option value="10">🎵 음악</option>
            <option value="20">🎮 게임</option>
            <option value="24">📺 엔터테인먼트</option>
            <option value="23">🤣 코미디</option>
            <option value="17">⚽ 스포츠</option>
            <option value="25">📰 뉴스/정치</option>
            <option value="22">✨ 인물/블로그</option>
            <option value="1">🎬 영화/애니</option>
            <option value="26">💄 스타일/뷰티</option>
            <option value="27">🏫 교육</option>
            <option value="28">🚀 과학기술</option>
            <option value="15">🐶 반려동물</option>
            <option value="2">🚗 자동차</option>
            <option value="19">✈️ 여행/이벤트</option>
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
                  <div className="channel-row-compact">
                    <span className="channel-name-text">{video.channelTitle}</span>
                    <button
                      className="compact-sub-btn"
                      onClick={(e) => handleSubscribe(e, video)}
                      title="구독 및 저장"
                    >
                      <UserPlus size={16} />
                    </button>
                  </div>
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
