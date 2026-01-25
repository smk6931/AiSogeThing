import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

// ========== 채널 관련 API ==========
export const getChannelsList = async (params = {}) => {
  const { search, category, limit = 50, offset = 0 } = params;
  const queryParams = new URLSearchParams();
  if (search) queryParams.append('search', search);
  if (category) queryParams.append('category', category);
  queryParams.append('limit', limit);
  queryParams.append('offset', offset);

  const res = await axios.get(`${API_URL}/api/youtube/channels/list?${queryParams}`, {
    withCredentials: true
  });
  return res.data;
};

export const getChannelDetail = async (channelId) => {
  const res = await axios.get(`${API_URL}/api/youtube/channels/${channelId}`, {
    withCredentials: true
  });
  return res.data;
};

// ========== 영상 피드 API ==========
export const getVideosFeed = async (params = {}) => {
  const { sort_by = 'newest', country, category, limit = 50, offset = 0 } = params;
  const queryParams = new URLSearchParams();
  queryParams.append('sort_by', sort_by);
  if (country) queryParams.append('country', country);
  if (category) queryParams.append('category', category);
  queryParams.append('limit', limit);
  queryParams.append('offset', offset);

  const res = await axios.get(`${API_URL}/api/youtube/videos/feed?${queryParams}`, {
    withCredentials: true
  });
  return res.data;
};

// ========== 구독 API (기존 유지) ==========
export const subscribeChannel = async (channelId, channelName) => {
  const res = await axios.post(
    `${API_URL}/api/youtube/interest/subscribe`,
    { channel_id: channelId, channel_name: channelName },
    { withCredentials: true }
  );
  return res.data;
};

export const unsubscribeChannel = async (channelId) => {
  const res = await axios.delete(`${API_URL}/api/youtube/interest/unsubscribe/${channelId}`, {
    withCredentials: true
  });
  return res.data;
};
