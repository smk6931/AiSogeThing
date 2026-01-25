import { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Loader } from 'lucide-react';
import { getRandomVideo, logYoutubeVideo, updateWatchTime } from '../../api/youtube';
import './YoutubePlayer.css';

// 전역 변수: API 로드 상태
let ytApiLoaded = false;

export default function YoutubePlayer({ video: initialVideo, onClose }) {
  // videoId가 아닌 video 객체 전체를 상태로 관리
  const [currentVideo, setCurrentVideo] = useState(initialVideo);
  const [nextLoading, setNextLoading] = useState(false);

  // YouTube API 관련 Refs
  const playerRef = useRef(null);      // YT.Player 인스턴스
  const containerRef = useRef(null);   // 플레이어 div 컨테이너
  const currentLogIdRef = useRef(null); // 현재 영상의 서버 로그 ID
  const watchTimeRef = useRef(0);      // 누적 시청 시간 (초)
  const totalDurationRef = useRef(0);  // 영상 전체 길이
  const intervalRef = useRef(null);    // 시간 측정 타이머

  // 최초 힌트 제어 (처음에만 보여주고 끌 것)
  const [showHint, setShowHint] = useState(true);

  // 1. YouTube API 스크립트 로드 (최초 1회)
  useEffect(() => {
    // 힌트는 2초 뒤에 사라짐 (한 번만)
    const hintTimer = setTimeout(() => {
      setShowHint(false);
    }, 2500);

    if (!ytApiLoaded) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      ytApiLoaded = true;
    }

    // 전역 콜백 (API 준비됨)
    window.onYouTubeIframeAPIReady = () => {
      if (currentVideo) {
        loadPlayer(currentVideo.id);
      }
    };

    // 이미 로드된 경우 바로 실행
    if (window.YT && window.YT.Player && currentVideo) {
      loadPlayer(currentVideo.id);
    }

    return () => clearTimeout(hintTimer);
  }, []);

  // 2. 비디오 변경 감지 -> 플레이어 로드/갱신
  useEffect(() => {
    if (currentVideo && window.YT && window.YT.Player) {
      loadPlayer(currentVideo.id);
    }
    return () => {
      stopTracking(); // 컴포넌트 언마운트/변경 시 추적 종료
    };
  }, [currentVideo]);


  // 플레이어 로드/큐잉
  const loadPlayer = (videoId) => {
    // 기존 로그 저장 (이전 영상이 있다면)
    stopTracking();

    // 시청 시작 (새 로그 생성)
    startTracking(videoId);

    if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
      // 이미 플레이어가 있으면 영상 로드
      playerRef.current.loadVideoById(videoId);
    } else {
      // 새 플레이어 생성
      playerRef.current = new window.YT.Player('youtube-player-div', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          'autoplay': 1,
          'playsinline': 1,
          'controls': 1
        },
        events: {
          'onReady': onPlayerReady,
          'onStateChange': onPlayerStateChange
        }
      });
    }
  };

  const onPlayerReady = (event) => {
    event.target.playVideo();
    totalDurationRef.current = event.target.getDuration();
  };

  const onPlayerStateChange = (event) => {
    // 재생 중(1)일 때만 타이머 가동
    if (event.data === window.YT.PlayerState.PLAYING) {
      startInterval();
      // 총 길이 다시 확인 (로딩 직후엔 0일 수 있어서)
      // 2. 총 길이 저장 (Optional)
      let duration = 0;
      if (playerRef.current && typeof playerRef.current.getDuration === 'function') {
        const d = playerRef.current.getDuration();
        if (typeof d === 'number' && !isNaN(d)) {
          duration = d;
        }
      }
      totalDurationRef.current = duration;
    } else {
      stopInterval();
    }
    // 종료(0) 시
    if (event.data === window.YT.PlayerState.ENDED) {
      loadNextVideo(); // 자동 다음 영상
    }
  };

  // 타이머 (1초마다 시청 시간 증가)
  const startInterval = () => {
    stopInterval();
    intervalRef.current = setInterval(() => {
      // 현재 재생 위치(초) 기록
      if (playerRef.current && playerRef.current.getCurrentTime) {
        watchTimeRef.current = playerRef.current.getCurrentTime();
      }
    }, 1000);
  };

  const stopInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // 새 영상 로깅 시작
  const startTracking = async (videoId) => {
    watchTimeRef.current = 0;
    currentLogIdRef.current = null; // 초기화

    // 메타데이터 준비 (currentVideo 상태 사용)
    let videoMeta = { id: videoId, title: "Watching..." };

    // 현재 상태의 비디오 객체가 해당 ID와 일치하면 메타데이터 사용
    if (currentVideo && currentVideo.id === videoId) {
      videoMeta = currentVideo;
    }

    const res = await logYoutubeVideo(videoMeta);

    if (res && res.log_id) {
      currentLogIdRef.current = res.log_id;
    } else {
      // 에러 처리
      console.error("❌ Watching Log Failed:", res);
    }
  };

  // 영상 종료/교체 시 로그 업데이트
  const stopTracking = () => {
    stopInterval();
    if (currentLogIdRef.current && watchTimeRef.current > 0) {
      // 비동기로 전송 (await 안 함)
      updateWatchTime(currentLogIdRef.current, watchTimeRef.current);
    }
    currentLogIdRef.current = null;
    watchTimeRef.current = 0;
  };

  // 다음 영상 로드 (Infinite Scroll)
  const loadNextVideo = async () => {
    setNextLoading(true);
    try {
      const res = await getRandomVideo();
      if (res.success && res.video) {
        // 약간의 딜레이 후 교체
        setTimeout(() => {
          // DB(snake_case) -> Frontend(CamelCase) 매핑
          const nextVideo = {
            id: res.video.video_id,
            title: res.video.title,
            description: res.video.description,
            thumbnail: res.video.thumbnail_url,
            channelTitle: res.video.channel_title,
            channelId: res.video.channel_id,
            // 필요한 다른 필드들...
            isShort: res.video.is_short,
            viewCount: res.video.view_count,
            publishedAt: res.video.published_at
          };

          setCurrentVideo(nextVideo);
          setNextLoading(false);
        }, 500);
      } else {
        setNextLoading(false);
      }
    } catch (error) {
      setNextLoading(false);
    }
  };

  if (!currentVideo) return null;

  return (
    <div className="youtube-modal-overlay" onClick={onClose}>
      <div className="youtube-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="youtube-close-btn" onClick={onClose}>
          <X size={24} />
        </button>

        {nextLoading && (
          <div className="next-video-loader">
            <Loader size={48} className="spinner-icon" />
            <p>다음 영상 불러오는 중...</p>
          </div>
        )}

        <div className="youtube-iframe-container">
          {/* IFrame 대신 API가 사용할 div */}
          <div id="youtube-player-div" ref={containerRef}></div>
        </div>

        {/* 우측 투명 터치 영역 (다음 영상 넘기기) */}
        {!nextLoading && (
          <div
            className="next-video-touch-area"
            onClick={(e) => {
              e.stopPropagation();
              loadNextVideo();
            }}
            title="다음 영상 (화면 우측 클릭)"
          >
            {/* 처음에만 보이는 힌트 */}
            {showHint && (
              <div className="next-video-hint">
                <span>👉</span>
                <span className="hint-text">다음 영상</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
