import { Home, Heart, MessageCircle, Users, MapPin, Youtube, BookOpen } from 'lucide-react';
import '../../components/layout/BottomNav.css';

// 게임 화면용 하단 네비게이션 (모달 전환 방식)
export default function GameBottomNav({ activeModal, onNavigate }) {

  const navItems = [
    { id: null, icon: Home, label: '마을', modal: null }, // null = 모달 닫기 (마을로 복귀)
    { id: 'hotplace', icon: MapPin, label: '핫플', modal: '안내소 (지도/데이트코스)' },
    { id: 'youtube', icon: Youtube, label: 'YouTube', modal: '영화관 (YouTube)' },
    { id: 'novel', icon: BookOpen, label: '웹툰', modal: '도서관 (웹툰/소설)' },
    { id: 'matching', icon: Heart, label: '매칭', modal: '카페 (매칭)' },
    { id: 'chat', icon: MessageCircle, label: '채팅', modal: '우체국 (채팅)' },
    { id: 'community', icon: Users, label: '커뮤니티', modal: '구청 (커뮤니티/피드)' },
  ];

  return (
    <nav className="bottom-nav" style={{ zIndex: 150 }}>
      <div className="bottom-nav__container">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModal === item.modal;

          return (
            <button
              key={item.id || 'home'}
              onClick={() => onNavigate(item.modal)}
              className={`bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0
              }}
            >
              <Icon size={24} />
              <span className="bottom-nav__label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
