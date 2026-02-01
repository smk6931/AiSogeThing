import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import GameEntry from './game/GameEntry';
import { AuthProvider } from './context/AuthContext';
import BottomNav from './components/layout/BottomNav';
import UserStatus from './components/layout/UserStatus';
import Onboarding from './pages/Onboarding/Onboarding';
import Matching from './pages/Matching/Matching';
import Chat from './pages/Chat/Chat';
import Community from './pages/Community/Community';
import MyPage from './pages/MyPage/MyPage';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import HotPlace from './pages/HotPlace/HotPlace';
import YoutubeBoard from './pages/Youtube/YoutubeBoardNew';
import NovelCreate from './pages/Novel/NovelCreate';
import NovelView from './pages/Novel/NovelView';
import NovelList from './pages/Novel/NovelList';
import NovelPortfolio from './pages/Novel/NovelPortfolio';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app">
          <Routes>
            {/* Main App Routes - Includes UserStatus */}
            <Route element={<><UserStatus /><Outlet /></>}>
              {/* 로그인 & 온보딩만 UserStatus 포함 */}
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/login" element={<Login />} />
            </Route>

            {/* 메인 = 아이소메트릭 마을 (UserStatus 없음 - 게임에 통합) */}
            <Route path="/" element={<GameEntry />} />

            {/* 레거시 호환 라우트들 (나중에 정리) */}
            <Route element={<><UserStatus /><Outlet /></>}>
              <Route path="/home" element={<Navigate to="/" replace />} />
            </Route>

            {/* 
              기존 페이지들은 이제 게임 내 건물 클릭으로만 접근 가능 
              (라우트는 남겨두되 직접 접근 시 메인으로 리다이렉트)
            */}
            <Route path="/hotplace" element={<Navigate to="/" replace />} />
            <Route path="/youtube" element={<Navigate to="/" replace />} />
            <Route path="/matching" element={<Navigate to="/" replace />} />
            <Route path="/chat" element={<Navigate to="/" replace />} />
            <Route path="/community" element={<Navigate to="/" replace />} />
            <Route path="/novel/*" element={<Navigate to="/" replace />} />
            <Route path="/mypage" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider >
  );
}

export default App;
