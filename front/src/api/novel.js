import client from './client';

// ========================================================
//  Novel API
// ========================================================

export const generateNovel = async (requestData) => {
  const response = await client.post('/novel/generate', requestData);
  return response.data;
};

export const getNovel = async (novelId) => {
  const response = await client.get(`/novel/${novelId}`);
  return response.data;
};

export const listNovels = async () => {
  const response = await client.get('/novel/');
  return response.data;
};

export const getCharacterImage = (filename) => {
  return `${client.defaults.baseURL}/novel/image/character/${filename}`;
};

export const getSceneImage = (filename) => {
  return `${client.defaults.baseURL}/novel/image/scene/${filename}`;
};
