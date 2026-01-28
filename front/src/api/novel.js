import client from './client';

// ========================================================
//  Novel API
// ========================================================

export const generateNovel = async (requestData) => {
  const response = await client.post('/api/novel/generate', requestData);
  return response.data;
};

export const getNovel = async (novelId) => {
  const response = await client.get(`/api/novel/${novelId}`);
  return response.data;
};

export const listNovels = async () => {
  const response = await client.get('/api/novel/');
  return response.data;
};

export const deleteNovel = async (novelId) => {
  const response = await client.delete(`/api/novel/${novelId}`);
  return response.data;
};

export const getCharacterImage = (filename) => {
  return `${client.defaults.baseURL}/api/novel/image/character/${filename}`;
};

export const getSceneImage = (filename) => {
  return `${client.defaults.baseURL}/api/novel/image/scene/${filename}`;
};
