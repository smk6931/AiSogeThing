import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
          {/* 전역 미니 프로필 (로그인 상태) + AI 챗봇 */}
          <UserStatus />

          <Routes>
            {/* 온보딩 페이지는 네비게이션 바 없음 */}
            <Route path="/onboarding" element={<Onboarding />} />

            {/* 로그인 페이지 */}
            <Route path="/login" element={<Login />} />

            {/* 메인 페이지들 - 네비게이션 바 포함 */}
            <Route path="/" element={<><Home /><BottomNav /></>} />
            <Route path="/hotplace" element={<><HotPlace /><BottomNav /></>} />
            <Route path="/youtube" element={<><YoutubeBoard /><BottomNav /></>} />
            <Route path="/matching" element={<><Matching /><BottomNav /></>} />
            <Route path="/chat" element={<><Chat /><BottomNav /></>} />
            <Route path="/community" element={<><Community /><BottomNav /></>} />

            {/* Novel */}
            <Route path="/novel" element={<><NovelList /><BottomNav /></>} />
            <Route path="/novel/portfolio" element={<><NovelPortfolio /><BottomNav /></>} />
            <Route path="/novel/create" element={<><NovelCreate /><BottomNav /></>} />
            <Route path="/novel/:id" element={<><NovelView /><BottomNav /></>} />

            <Route path="/mypage" element={<><MyPage /><BottomNav /></>} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
