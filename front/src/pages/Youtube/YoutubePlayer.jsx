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

  // 마우스 휠 이벤트 (PC용)
  useEffect(() => {
    const handleWheel = (e) => {
      // 휠을 아래로(deltaY > 0) + 로딩 아님
      if (e.deltaY > 50 && !nextLoading) {
        loadNextVideo();
      }
    };

    const container = contentRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel);
    }
    return () => {
      if (container) container.removeEventListener('wheel', handleWheel);
    };
  }, [currentVideoId, nextLoading]); // currentVideoId가 바뀌면 리스너 갱신

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
          <iframe
            key={currentVideoId} // key 변경으로 컴포넌트 리마운트 -> 자동재생
            src={`https://www.youtube.com/embed/${currentVideoId}?autoplay=1`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>

        {/* 안내 텍스트 (PC에서만) */}
        <div className="scroll-hint">
          <span>👇 스크롤하여 다음 영상</span>
          <ChevronDown size={20} className="bounce-icon" />
        </div>
      </div>
    </div>
  );
}
