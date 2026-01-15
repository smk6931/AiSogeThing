import { NavLink } from 'react-router-dom';
import { Home, Heart, MessageCircle, Users, User, MapPin } from 'lucide-react';
import './BottomNav.css';

export default function BottomNav() {
  const navItems = [
    { to: '/', icon: Home, label: '홈' },
    { to: '/hotplace', icon: MapPin, label: '핫플' },
    { to: '/matching', icon: Heart, label: '매칭' },
    { to: '/chat', icon: MessageCircle, label: '채팅' },
    { to: '/community', icon: Users, label: '커뮤니티' },
    { to: '/mypage', icon: User, label: '마이' },
  ];

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav__container">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`
              }
            >
              <Icon size={24} />
              <span className="bottom-nav__label">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
