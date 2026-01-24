import { useState, useEffect } from 'react';
import { X, User, MessageCircle, UserPlus } from 'lucide-react';
import userApi from '../../api/user';
import { useAuth } from '../../context/AuthContext';
import UserProfile from '../UserProfile';
import './OnlineUsersModal.css';

export default function OnlineUsersModal({ isOpen, onClose }) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchOnlineUsers();
    }
  }, [isOpen]);

  const fetchOnlineUsers = async () => {
    try {
      setLoading(true);
      const response = await userApi.getOnlineUsersDetail();
      setUsers(response.data.users);
    } catch (error) {
      console.error('Failed to fetch online users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (userId) => {
    // 자기 자신은 클릭 불가
    if (currentUser && currentUser.user_id === userId) return;
    setSelectedUserId(userId);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="online-modal-overlay" onClick={onClose}>
        <div className="online-modal" onClick={(e) => e.stopPropagation()}>
          <div className="online-modal__header">
            <h3>현재 접속 중인 이웃</h3>
            <span className="online-badge">🟢 {users.length}명</span>
            <button className="online-modal__close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <div className="online-modal__content">
            {loading ? (
              <div className="online-modal__loading">
                <div className="spinner"></div>
              </div>
            ) : (
              <div className="user-list">
                {users.map((u) => {
                  // 디버깅: 데이터 확인
                  // console.log("User Item:", u); 
                  const isMe = currentUser && currentUser.user_id === u.id;
                  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.nickname)}&background=667eea&color=fff&size=64`;

                  return (
                    <div
                      key={u.id}
                      className={`user-item ${isMe ? 'me' : 'clickable'}`}
                      onClick={isMe ? undefined : () => handleUserClick(u.uuid)}
                      style={{ cursor: isMe ? 'default' : 'pointer' }}
                    >
                      <div className="user-item__info">
                        <img src={avatarUrl} alt={u.nickname} className="user-item__avatar" />
                        <div>
                          <div className="user-item__name">
                            {u.nickname}
                            {isMe && <span className="me-badge">나</span>}
                          </div>
                          <div className="user-item__status">방금 전 활동</div>
                        </div>
                      </div>

                      {!isMe && (
                        <div className="user-item__actions" onClick={(e) => e.stopPropagation()}>
                          {/* 추후 기능 구현 예정 */}
                          <button className="icon-btn"><UserPlus size={18} /></button>
                          <button className="icon-btn"><MessageCircle size={18} /></button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* UserProfile 모달 */}
      {selectedUserId && (
        <UserProfile
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </>
  );
}
