import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import userApi from '../../api/user';
import OnlineUsersModal from '../common/OnlineUsersModal';
import './UserStatus.css';

export default function UserStatus() {
  const { user } = useAuth();
  const [onlineCount, setOnlineCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 5초마다 접속자 수 조회 + Heartbeat 전송
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        // 1. 전체 접속자 수 조회
        const response = await userApi.getOnlineStats();
        setOnlineCount(response.data.online_users);

        // 2. 로그인 상태면 Heartbeat(생존 신호) 전송
        if (user) {
          await userApi.sendHeartbeat();
        }
      } catch (error) {
        console.error('Status Error:', error);
      }
    };

    // 최초 1회 실행
    fetchStatus();

    // 5초 주기 폴링 (테스트용 짧은 주기)
    const interval = setInterval(fetchStatus, 5000);

    return () => clearInterval(interval);
  }, [user]);

  // 천 단위 콤마 포맷팅
  const formattedCount = onlineCount.toLocaleString();

  return (
    <>
      <div className="user-status-container">
        <button className="online-status-badge" onClick={() => setIsModalOpen(true)}>
          <span className="online-status-dot"></span>
          <span className="online-status-text">
            <span className="online-count">{formattedCount}</span>명 접속 중
          </span>
        </button>
      </div>

      <OnlineUsersModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
