import client from './client';

export const searchYoutube = async (query) => {
  const response = await client.get('/api/youtube/search', {
    params: { query: query }
  });
  return response.data;
};

export const getPopularYoutube = async (categoryId = null) => {
  const params = categoryId ? { categoryId } : {};
  const response = await client.get('/api/youtube/popular', { params });
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

export const logYoutubeVideo = async (videoData) => {
  try {
    await client.post('/api/youtube/log', videoData);
  } catch (error) {
    console.error('Log Error:', error);
  }
};
