import client from './client';

/**
 * 🎥 유튜브 관련 API (Youtube API)
 */

export const searchYoutube = async (query) => {
  const response = await client.get('/api/youtube/search', { params: { query } });
  return response.data;
};

export const getPopularYoutube = async (categoryId = null) => {
  const params = categoryId ? { categoryId } : {};
  const response = await client.get('/api/youtube/popular', { params });
  return response.data;
};

// 2. 시청 기록 조회
export const getHistory = async () => {
  // 백엔드가 리스트를 바로 주는지, {data: ...}로 주는지에 따라 다르지만
  // client.js interceptor가 data를 벗겨내는지 확인 필요.
  // 보통 axios는 .data에 본문이 있음.
  // 기존 코드 패턴(response.data 반환)을 따름.
  const response = await client.get('/api/youtube/history');
  return response.data;
};

export const getDatingYoutube = async () => {
  const response = await client.get('/api/youtube/dating');
  return response.data;
};

export const discoverDatingChannels = async (category = 'reality') => {
  const response = await client.post('/api/youtube/dating/discover', { category });
  return response.data;
};

// 1. 시청 로그 저장 (클릭 시 호출)
export const logYoutubeVideo = async (video) => {
  // video 객체 구조 분해 및 안전한 Payload 생성
  const payload = {
    video_id: video.id,
    title: video.title,
    description: video.description || "",
    thumbnail_url: video.thumbnail || "",
    channel_title: video.channelTitle || ""
  };

  try {
    await client.post('/api/youtube/log', payload);
  } catch (error) {
    console.error('Log Error:', error);
  }
};

// =========================================================
//  사용자 정의 관심사 (RSS) API
// =========================================================
export const discoverInterest = async (keyword) => {
  const response = await client.post('/api/youtube/interest/discover', { keyword });
  return response.data;
};

export const getInterestYoutube = async (keyword = null) => {
  const response = await client.get('/api/youtube/interest', { params: { keyword } });
  return response.data;
};
