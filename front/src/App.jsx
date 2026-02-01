import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import GameEntry from './game/GameEntry';
import { AuthProvider } from './context/AuthContext';
import BottomNav from './components/layout/BottomNav';
import UserStatus from './components/layout/UserStatus';
import Home from './pages/Home/Home'; // 추가
import Onboarding from './pages/Onboarding/Onboarding';
import Matching from './pages/Matching/Matching';
import Chat from './pages/Chat/Chat';
import Community from './pages/Community/Community';
import MyPage from './pages/MyPage/MyPage';
import Login from './pages/Login/Login';
import HotPlace from './pages/HotPlace/HotPlace';
import YoutubeBoard from './pages/Youtube/YoutubeBoardNew';
import NovelCreate from './pages/Novel/NovelCreate';
import NovelView from './pages/Novel/NovelView';
import NovelList from './pages/Novel/NovelList';
import NovelPortfolio from './pages/Novel/NovelPortfolio';
import './App.css';

// 메인 앱 레이아웃 (UserStatus + BottomNav 포함)
function AppLayout() {
  return (
    <>
      <UserStatus />
      <div style={{ paddingTop: '60px', paddingBottom: '70px' }}>
        <Outlet />
      </div>
      <BottomNav />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app">
          <Routes>
            {/* 로그인 & 온보딩 (레이아웃 없음) */}
            <Route path="/login" element={<Login />} />
            <Route path="/onboarding" element={<Onboarding />} />

            {/* 3D 게임 (독립) */}
            <Route path="/game" element={<GameEntry />} />

            {/* 메인 앱 (UserStatus + BottomNav) */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<Home />} />
              <Route path="/hotplace" element={<HotPlace />} />
              <Route path="/youtube" element={<YoutubeBoard />} />
              <Route path="/matching" element={<Matching />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/community" element={<Community />} />
              <Route path="/mypage" element={<MyPage />} />

              {/* Novel Routes */}
              <Route path="/novel" element={<NovelList />} />
              <Route path="/novel/create" element={<NovelCreate />} />
              <Route path="/novel/portfolio" element={<NovelPortfolio />} />
              <Route path="/novel/:id" element={<NovelView />} />
            </Route>
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
