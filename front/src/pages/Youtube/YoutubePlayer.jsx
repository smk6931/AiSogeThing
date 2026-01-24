import { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Loader } from 'lucide-react';
import { getRandomVideo, logYoutubeVideo } from '../../api/youtube'; // API import
import './YoutubePlayer.css';

export default function YoutubePlayer({ videoId: initialVideoId, onClose }) {
  const [currentVideoId, setCurrentVideoId] = useState(initialVideoId);
  const [nextLoading, setNextLoading] = useState(false);
  const contentRef = useRef(null);

  // 초기 비디오 변경 시 업데이트
  useEffect(() => {
    setCurrentVideoId(initialVideoId);
  }, [initialVideoId]);

  // 마우스 휠 이벤트 (PC용) + 터치 이벤트 (모바일용)
  useEffect(() => {
    let touchStartY = 0;
    let touchStartTime = 0;

    const handleWheel = (e) => {
      // 휠을 아래로(deltaY > 0) + 로딩 아님
      if (e.deltaY > 50 && !nextLoading) {
        e.preventDefault();
        loadNextVideo();
      }
    };

    const handleTouchStart = (e) => {
      // iframe 위에서 터치해도 감지되도록
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    };

    const handleTouchMove = (e) => {
      // 수직 스크롤 방지 (유튜브 쇼츠처럼)
      const touchCurrentY = e.touches[0].clientY;
      const diff = touchStartY - touchCurrentY;
      if (Math.abs(diff) > 30) {
        e.preventDefault(); // 기본 스크롤 방지
      }
    };

    const handleTouchEnd = (e) => {
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndTime = Date.now();
      const diff = touchStartY - touchEndY; // 양수 = 위로 스와이프
      const duration = touchEndTime - touchStartTime;

      // 위로 스와이프 (diff > 80) + 빠른 동작 (< 500ms) + 로딩 아님
      if (diff > 80 && duration < 500 && !nextLoading) {
        loadNextVideo();
      }
    };

    const container = contentRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      container.addEventListener('touchstart', handleTouchStart, { passive: false });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd, { passive: false });
    }
    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [nextLoading]); // currentVideoId 의존성 제거 (불필요한 재등록 방지)

  const loadNextVideo = async () => {
    setNextLoading(true);
    try {
      const res = await getRandomVideo();
      if (res.success && res.video) {
        // 부드러운 전환을 위해 약간의 딜레이
        setTimeout(() => {
          setCurrentVideoId(res.video.video_id);
          setNextLoading(false);

          // 로그 저장 (선택)
          logYoutubeVideo({
            id: res.video.video_id,
            title: res.video.title,
            thumbnail: res.video.thumbnail_url,
            channelTitle: res.video.channel_title
          });
        }, 500);
      } else {
        setNextLoading(false);
      }
    } catch (error) {
      console.error("다음 영상 로드 실패:", error);
      setNextLoading(false);
    }
  };

  if (!currentVideoId) return null;

  return (
    <div className="youtube-modal-overlay" onClick={onClose}>
      <div
        className="youtube-modal-content"
        onClick={(e) => e.stopPropagation()}
        ref={contentRef}
      >
        <button className="youtube-close-btn" onClick={onClose}>
          <X size={24} />
        </button>

        {/* 로딩 오버레이 */}
        {nextLoading && (
          <div className="next-video-loader">
            <Loader size={48} className="spinner-icon" />
            <p>다음 영상 불러오는 중...</p>
          </div>
        )}

        <div className="youtube-iframe-container">
          {/* 터치 캡처 오버레이: iframe 위에서도 터치/휠 이벤트 감지 */}
          <div
            className="touch-capture-overlay"
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              zIndex: nextLoading ? 999 : 1, // 로딩 중엔 클릭 차단, 평소엔 뒤에
              pointerEvents: nextLoading ? 'auto' : 'none', // 로딩 아닐 때 클릭 통과
              background: nextLoading ? 'rgba(0,0,0,0.3)' : 'transparent'
            }}
          />
          <iframe
            key={currentVideoId} // key 변경으로 컴포넌트 리마운트 -> 자동재생
            src={`https://www.youtube.com/embed/${currentVideoId}?autoplay=1`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>

        {/* 안내 텍스트 (PC/모바일 공통) */}
        <div className="scroll-hint">
          <span>� 스와이프하여 다음 영상</span>
          <ChevronDown size={20} className="bounce-icon" />
        </div>
      </div>
    </div>
  );
}
