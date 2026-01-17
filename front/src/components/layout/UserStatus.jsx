import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './UserStatus.css';

export default function UserStatus() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) {
    return (
      <button className="user-status user-status--login" onClick={() => navigate('/login')}>
        <LogIn size={18} />
        <span>로그인</span>
      </button>
    );
  }

  return (
    <div className="user-status-container" ref={menuRef}>
      <button
        className={`user-status user-status--logged-in ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <img src={user.avatar} alt={user.name} className="user-status__avatar" />
        <div className="user-status__text">
          <span className="user-status__name">{user.name}</span>
          <span className="user-status__id">@{user.username}</span>
        </div>
        <ChevronDown size={14} className={`user-status__arrow ${isOpen ? 'rotate' : ''}`} />
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="user-dropdown">
          <div className="user-dropdown__header">
            <span className="user-dropdown__label">내 계정</span>
          </div>
          <button className="user-dropdown__item" onClick={() => { navigate('/mypage'); setIsOpen(false); }}>
            <User size={16} />
            <span>내 프로필</span>
          </button>
          <button className="user-dropdown__item" onClick={() => { /* 설정 페이지 연동 */ setIsOpen(false); }}>
            <Settings size={16} />
            <span>개인 설정</span>
          </button>
          <div className="user-dropdown__divider"></div>
          <button className="user-dropdown__item user-dropdown__item--danger" onClick={() => { logout(); setIsOpen(false); }}>
            <LogOut size={16} />
            <span>로그아웃</span>
          </button>
        </div>
      )}
    </div>
  );
}
