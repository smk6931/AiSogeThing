import { createContext, useState, useContext } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // 임시 로그인 상태 (초기값: null = 로그아웃 상태)
  const [user, setUser] = useState(null);

  const login = (username) => {
    // 임시 로그인 처리
    setUser({
      name: username === 'admin' ? '관리자' : '김소개', // 예시로 이름 구분
      username: username, // 아이디 저장
      avatar: 'https://i.pravatar.cc/150?u=me',
      id: 'user_123'
    });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
