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

  // 최초 힌트 제어
  const [showHint, setShowHint] = useState(true);
  // 구독 버튼 표시 제어 (자동 숨김)
  const [showSubscribeBtn, setShowSubscribeBtn] = useState(true);

  // 1. YouTube API 스크립트 로드 (최초 1회)
  useEffect(() => {
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

    // 비디오 변경 시 버튼 보였다가 숨기기
    setShowSubscribeBtn(true);
    const subTimer = setTimeout(() => {
      setShowSubscribeBtn(false);
    }, 1000); // 1초 뒤 사라짐

    return () => {
      stopTracking(); // 컴포넌트 언마운트/변경 시 추적 종료
      clearTimeout(subTimer);
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
    console.log("👉 Loading Next Video...");
    setNextLoading(true);

    try {
      const res = await getRandomVideo();
      console.log("👉 Random Video Result:", res);

      if (res && res.video) {
        // 약간의 딜레이 후 교체 (로딩 UX)
        setTimeout(() => {
          // DB(snake_case) -> Frontend(CamelCase) 매핑
          const nextVideo = {
            id: res.video.video_id,
            title: res.video.title,
            description: res.video.description,
            thumbnail: res.video.thumbnail_url,
            channelTitle: res.video.channel_title,
            channelId: res.video.channel_id,
            isShort: res.video.is_short,
            viewCount: res.video.view_count,
            publishedAt: res.video.published_at
          };

          setCurrentVideo(nextVideo);
          // 여기서 finally 블록에서 false 처리되므로 생략 가능하나, 
          // setTimeout 내부이므로 여기서 직접 false 처리해야 딜레이가 적용됨
          setNextLoading(false);
        }, 500);
        return; // 성공 시 finally 전에 함수 종료되는 게 아니라, 비동기 setTimeout이므로 finally가 먼저 실행됨. 
        // 주의: finally에서 setNextLoading(false)를 하면 딜레이가 의미 없어짐.
        // 따라서 성공 시에는 setTimeout 안에서 끄고, 실패 시에만 즉시 끄도록 로직 수정 필요.
      } else {
        console.warn("No video found in response");
        alert("다음 영상을 불러올 수 없습니다. (데이터 없음)");
        setNextLoading(false);
      }
    } catch (error) {
      console.error("Next Video Error:", error);
      alert("다음 영상 로딩 중 오류가 발생했습니다.");
      setNextLoading(false);
    }
    // finally 사용 시 setTimeout 딜레이가 씹힐 수 있으므로, 
    // 위에서 각각 setNextLoading(false) 처리함.
  };

  if (!currentVideo) return null;

  // 구독 처리
  const handleSubscribe = async () => {
    if (!currentVideo) return;

    const channelId = currentVideo.channelId || currentVideo.channel_id || currentVideo.snippet?.channelId;
    const channelName = currentVideo.channelTitle || currentVideo.channel_title || currentVideo.snippet?.channelTitle || "Unknown Channel";

    if (!channelId) {
      alert('채널 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      const { default: client } = await import('../../api/client');

      await client.post('/api/youtube/channel/subscribe', {
        channel_id: channelId
      });
      alert(`✅ "${channelName}" 채널을 구독했습니다!`);
    } catch (error) {
      console.error("[Subscribe Error]", error);
      alert('구독 실패! (콘솔 로그를 확인해주세요)');
    }
  };

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

          {/* 우측 투명 터치 영역 (다음 영상 넘기기) - 로딩 중엔 클릭 방지 */}
          {!nextLoading && (
            <div
              className="next-video-touch-area"
              onClick={(e) => {
                e.stopPropagation();
                loadNextVideo();
              }}
              title="다음 영상 (화면 우측 상단 클릭)"
            >
              {/* 처음에만 보이는 힌트 */}
              {showHint && (
                <div className="next-video-hint">
                  <span>👉</span>
                  <span className="hint-text">Next</span>
                </div>
              )}
            </div>
          )}

          {/* 심플 구독 버튼 (중앙 하단, 4초 뒤 사라짐) - 로딩 중엔 숨김 */}
          {!nextLoading && (
            <button
              className={`simple-subscribe-btn ${!showSubscribeBtn ? 'hidden' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleSubscribe();
              }}
            >
              <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>+</span> 구독
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
