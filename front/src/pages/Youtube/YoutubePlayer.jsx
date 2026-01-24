import { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Loader } from 'lucide-react';
import { getRandomVideo, logYoutubeVideo, updateWatchTime } from '../../api/youtube';
import './YoutubePlayer.css';

// 전역 변수: API 로드 상태
let ytApiLoaded = false;

export default function YoutubePlayer({ videoId: initialVideoId, onClose }) {
  const [currentVideoId, setCurrentVideoId] = useState(initialVideoId);
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
      loadPlayer(currentVideoId);
    };

    // 이미 로드된 경우 바로 실행
    if (window.YT && window.YT.Player) {
      loadPlayer(currentVideoId);
    }

    return () => clearTimeout(hintTimer);
  }, []);

  // 2. 비디오 ID 변경 감지 -> 플레이어 로드/갱신
  useEffect(() => {
    if (currentVideoId && window.YT && window.YT.Player) {
      loadPlayer(currentVideoId);
    }
    return () => {
      stopTracking(); // 컴포넌트 언마운트/변경 시 추적 종료
    };
  }, [currentVideoId]);


  // 플레이어 로드/큐잉
  const loadPlayer = (videoId) => {
    // 기존 로그 저장 (이전 영상이 있다면)
    stopTracking();

    // 시청 시작 (새 로그 생성)
    startTracking(videoId);

    if (playerRef.current) {
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
      totalDurationRef.current = playerRef.current.getDuration();
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
      // 현재 재생 위치(초) 기록 (건너뛰기 감지용이 아니라 단순히 '체류 시간'을 측정할 거라면 +1 씩 하는게 맞음)
      // 하지만 '어디까지 봤냐'가 중요하다면 currentTime을 써야 함.
      // 여기서는 "얼마나 관심 있었냐(=체류 시간)"이므로 단순 카운팅보다는
      // 실제 재생 헤드 위치가 유의미할 수 있음. 
      // 일단 간단하게: currentTime을 watchedTime으로 간주 (끝까지 보면 100%)

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

    // 여기서는 상세 정보가 없으므로(API가 안 줌), 랜덤 추천 시 받은 정보를 써야 함.
    // 하지만 getRandomVideo 응답 데이터를 state로 관리 안 했음...
    // 괜찮음, logYoutubeVideo는 title 등이 없어도 동작하도록 수정되어 있음 (Optional).
    // 그래도 최대한 정보가 있으면 좋으니, API에서 가져올 때 메타정보를 저장해두는 게 좋음.
    // (지금은 단순화를 위해 ID만 넘김 -> 백엔드가 이미 정보를 갖고 있으면(youtube_list) 그걸 씀)

    // *임시*: 일단 ID만으로 로그 생성 요청. (Service가 youtube_list 조회해서 채워주진 않으므로 빈칸일 수 있음)
    // -> 해결책: getRandomVideo 결과를 state에 저장하거나, 여기서 fetch 필요.
    // 일단은 그냥 호출.
    const res = await logYoutubeVideo({ id: videoId, title: "Watching..." });
    if (res && res.log_id) {
      currentLogIdRef.current = res.log_id;
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

  // 다음 영상 로드
  const loadNextVideo = async () => {
    setNextLoading(true);
    try {
      const res = await getRandomVideo();
      if (res.success && res.video) {
        // 약간의 딜레이 후 교체
        setTimeout(() => {
          setCurrentVideoId(res.video.video_id);
          // logYoutubeVideo는 startTracking에서 처리함
          setNextLoading(false);

          // 메타데이터 보정을 위해 타이틀 저장 (필요 시)
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
