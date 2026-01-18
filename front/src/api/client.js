import axios from 'axios';

// 백엔드 기본 URL 설정
const client = axios.create({
  // baseURL: 'http://168.107.52.201:8080',
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 응답 인터셉터 (에러 처리 공통화 가능)
client.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default client;
