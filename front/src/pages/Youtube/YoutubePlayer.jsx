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

  // 버튼 투명도 제어 (초기 1 -> 2초 뒤 0)
  const [btnOpacity, setBtnOpacity] = useState(1);

  // 영상 ID가 바뀔 때마다 버튼을 다시 보여줌
  useEffect(() => {
    setBtnOpacity(1);
    const timer = setTimeout(() => {
      setBtnOpacity(0); // 2초 뒤 투명화 (클릭은 가능)
    }, 2000);
    return () => clearTimeout(timer);
  }, [currentVideoId]);

  // 다음 영상 로드 함수
  const loadNextVideo = async () => {
    setNextLoading(true);
    setBtnOpacity(1); // 로딩 중에는 다시 보여줌
    try {
      const res = await getRandomVideo();
      if (res.success && res.video) {
        setTimeout(() => {
          setCurrentVideoId(res.video.video_id);
          setNextLoading(false);
          // 로그 저장 생략
        }, 500);
      } else {
        setNextLoading(false);
      }
    } catch (error) {
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

        {/* 심플한 다음 영상 버튼 (우측 하단 + 자동 숨김) */}
        {!nextLoading && (
          <button
            className="next-video-btn"
            onClick={(e) => {
              e.stopPropagation();
              loadNextVideo();
            }}
            style={{ opacity: btnOpacity }}
            title="다음 영상 (클릭)"
          >
            <ChevronDown size={28} style={{ transform: 'rotate(-90deg)' }} />
          </button>
        )}
      </div>
    </div>
  );
}
