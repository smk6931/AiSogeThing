import React, { useState, useEffect } from 'react';
import { Search, Tag, TrendingUp, Calendar } from 'lucide-react';
import { getChannelsList, subscribeChannel, unsubscribeChannel } from '../../api/channelsApi';
import './ChannelExplorer.css';

export default function ChannelExplorer({ onChannelClick }) {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    loadChannels();
  }, [search, category]);

  const loadChannels = async () => {
    setLoading(true);
    try {
      const data = await getChannelsList({ search, category, limit: 50 });
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
      // Reload to update subscription status
      loadChannels();
    } catch (error) {
      console.error('Subscribe failed:', error);
    }
  };

  return (
    <div className="channel-explorer">
      {/* Search & Filter Bar */}
      <div className="explorer-header">
        <div className="search-box">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="채널명, 키워드로 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="category-select"
        >
          <option value="">모든 카테고리</option>
          <option value="Gaming">게임</option>
          <option value="Music">음악</option>
          <option value="Education">교육</option>
          <option value="Entertainment">엔터테인먼트</option>
        </select>
      </div>

      {/* Channel Grid */}
      <div className="channel-grid">
        {loading ? (
          <div className="loading-message">채널을 불러오는 중...</div>
        ) : channels.length === 0 ? (
          <div className="empty-message">채널이 없습니다. 🔍</div>
        ) : (
          channels.map((channel) => (
            <div key={channel.channel_id} className="channel-card">
              {/* Channel Thumbnail/Profile */}
              <div className="channel-avatar">
                {channel.name.charAt(0).toUpperCase()}
              </div>

              {/* Channel Info */}
              <div className="channel-info">
                <h3 className="channel-name" onClick={() => onChannelClick(channel)}>
                  {channel.name}
                </h3>

                {channel.category && (
                  <div className="channel-category">
                    <Tag size={14} />
                    {channel.category}
                  </div>
                )}

                {channel.keywords && (
                  <div className="channel-keywords">
                    {channel.keywords.split(',').slice(0, 3).map((kw, i) => (
                      <span key={i} className="keyword-tag">#{kw.trim()}</span>
                    ))}
                  </div>
                )}

                {channel.description && (
                  <p className="channel-description">
                    {channel.description.substring(0, 100)}
                    {channel.description.length > 100 && '...'}
                  </p>
                )}
              </div>

              {/* Subscribe Button */}
              <button
                className={`subscribe-btn ${channel.is_subscribed ? 'subscribed' : ''}`}
                onClick={() => handleSubscribe(channel)}
              >
                {channel.is_subscribed ? '구독중 ✓' : '+ 구독하기'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
