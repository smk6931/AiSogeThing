import React, { useState } from 'react';
import { List, Video, Compass } from 'lucide-react';
import ChannelExplorer from './ChannelExplorer';
import VideoFeed from './VideoFeed';
import YoutubePlayer from './YoutubePlayer';
import { discoverInterest, getAdhocRssVideos } from '../../api/youtube';
import { getChannelDetail } from '../../api/channelsApi';
import './YoutubeBoard.css';

export default function YoutubeBoard() {
  const [activeTab, setActiveTab] = useState('channels'); // 'channels' | 'feed' | 'discover'
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [channelVideos, setChannelVideos] = useState([]);
  const [loading, setLoading] = useState(false);

  // Discovery State
  const [discoverKeyword, setDiscoverKeyword] = useState('');
  const [discoveredChannels, setDiscoveredChannels] = useState([]);

  // 채널 클릭 핸들러
  const handleChannelClick = async (channel) => {
    setSelectedChannel(channel);
    setLoading(true);

    try {
      // RSS로 해당 채널의 최신 영상 가져오기
      const result = await getAdhocRssVideos([{
        id: channel.channel_id,
        name: channel.name
      }]);

      setChannelVideos(result.items || []);
    } catch (error) {
      console.error('Failed to load channel videos:', error);
      setChannelVideos([]);
    } finally {
      setLoading(false);
    }
  };

  // 영상 클릭 핸들러
  const handleVideoClick = (video) => {
    setSelectedVideo(video);
  };

  // 채널 발굴 핸들러
  const handleDiscover = async () => {
    if (!discoverKeyword.trim()) return alert('키워드를 입력해주세요');

    if (!confirm(`🤖 AI가 '${discoverKeyword}' 관련 채널을 찾아냅니다.\n(API 100점 소모)\n\n계속하시겠습니까?`)) return;

    setLoading(true);
    try {
      const res = await discoverInterest(discoverKeyword);
      if (res.error) {
        alert('오류 발생: ' + res.error);
      } else {
        const found = res.channels || [];
        setDiscoveredChannels(found);
        alert(`✨ ${found.length}개의 채널을 발굴했습니다!`);
      }
    } catch (e) {
      alert('요청 실패');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="youtube-board-v2">
      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`nav-tab ${activeTab === 'channels' ? 'active' : ''}`}
          onClick={() => setActiveTab('channels')}
        >
          <List size={20} />
          채널 리스트
        </button>
        <button
          className={`nav-tab ${activeTab === 'feed' ? 'active' : ''}`}
          onClick={() => setActiveTab('feed')}
        >
          <Video size={20} />
          영상 피드
        </button>
        <button
          className={`nav-tab ${activeTab === 'discover' ? 'active' : ''}`}
          onClick={() => setActiveTab('discover')}
        >
          <Compass size={20} />
          채널 발굴
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'channels' && (
          <div>
            <ChannelExplorer onChannelClick={handleChannelClick} />

            {/* Channel Detail Overlay */}
            {selectedChannel && (
              <div className="channel-detail-overlay">
                <div className="overlay-content">
                  <button className="close-btn" onClick={() => setSelectedChannel(null)}>×</button>

                  <div className="channel-header">
                    <div className="channel-avatar-large">
                      {selectedChannel.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2>{selectedChannel.name}</h2>
                      {selectedChannel.category && <span className="category-badge">{selectedChannel.category}</span>}
                      {selectedChannel.description && <p className="channel-desc">{selectedChannel.description}</p>}
                      {selectedChannel.keywords && (
                        <div className="keywords">
                          {selectedChannel.keywords.split(',').map((kw, i) => (
                            <span key={i} className="keyword">#{kw.trim()}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 style={{ marginTop: '24px', color: '#fff' }}>최신 영상 (RSS)</h3>

                  {loading ? (
                    <p style={{ color: '#aaa', textAlign: 'center', padding: '40px' }}>영상을 불러오는 중...</p>
                  ) : channelVideos.length === 0 ? (
                    <p style={{ color: '#aaa', textAlign: 'center', padding: '40px' }}>영상이 없습니다</p>
                  ) : (
                    <div className="channel-videos-grid">
                      {channelVideos.map((video) => (
                        <div key={video.id} className="mini-video-card" onClick={() => handleVideoClick(video)}>
                          <img src={video.thumbnail} alt={video.title} />
                          <div className="mini-video-title">{video.title}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'feed' && (
          <VideoFeed onVideoClick={handleVideoClick} />
        )}

        {activeTab === 'discover' && (
          <div className="discover-panel">
            <div className="discover-header">
              <h2>⭐ AI 채널 큐레이터</h2>
              <p>관심있는 키워드를 입력하면 AI가 관련 유튜버를 찾아줍니다</p>
            </div>

            <div className="discover-input-group">
              <input
                type="text"
                placeholder="관심사 입력 (예: EPL 축구, 주식 투자)"
                value={discoverKeyword}
                onChange={(e) => setDiscoverKeyword(e.target.value)}
                className="discover-input"
              />
              <button onClick={handleDiscover} className="discover-btn" disabled={loading}>
                {loading ? '검색 중...' : '✨ 채널 발굴'}
              </button>
            </div>

            {discoveredChannels.length > 0 && (
              <div className="discovered-results">
                <h3>{discoveredChannels.length}개의 채널을 발견했습니다!</h3>
                <div className="discovered-grid">
                  {discoveredChannels.map((ch) => (
                    <div key={ch.id} className="discovered-card" onClick={() => handleChannelClick(ch)}>
                      <div className="disc-avatar">{ch.name.charAt(0)}</div>
                      <div className="disc-name">{ch.name}</div>
                      <div className="disc-keyword">{ch.keyword}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      {selectedVideo && (
        <div className="player-modal">
          <button className="modal-close" onClick={() => setSelectedVideo(null)}>×</button>
          <YoutubePlayer video={selectedVideo} />
        </div>
      )}
    </div>
  );
}
