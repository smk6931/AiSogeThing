import re
import os
import urllib.parse
from datetime import datetime
from dotenv import load_dotenv
from utils.safe_ops import safe_http_get, load_json_safe, save_json_safe, append_json_line

# .env 로드
env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    load_dotenv()

API_KEY = os.getenv("YOUTUBE_API_KEY") or os.getenv("VITE_YOUTUBE_API_KEY")
BASE_URL = "https://www.googleapis.com/youtube/v3"

def save_interaction_log(log_data: dict):
    """
    유튜브 인터랙션 로그 저장 (JSONL)
    """
    log_file = os.path.join(os.path.dirname(__file__), '..', 'logs', 'youtube_interaction.jsonl')
    log_data['timestamp'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    append_json_line(log_file, log_data)
    return True

def _manage_quota(cost=0):
    """
    유튜브 API 할당량 관리 (일일 10,000 point)
    검색: 100점 / 조회: 1점
    """
    quota_file = os.path.join(os.path.dirname(__file__), 'youtube_quota.json')
    today = datetime.now().strftime('%Y-%m-%d')
    limit = 10000
    
    saved_data = load_json_safe(quota_file)
    
    # 날짜 체크 및 초기화
    if saved_data and saved_data.get('date') == today:
        data = saved_data
    else:
        data = {"date": today, "remaining": limit, "limit": limit}
        
    # 사용량 차감
    if cost > 0:
        data['remaining'] = max(0, data['remaining'] - cost)
        save_json_safe(quota_file, data)
        
    return data['remaining'], limit

def _parse_duration(duration_str):
    """YouTube Duration (ISO 8601) -> Seconds"""
    if not duration_str: return 0
    # PT1H2M10S 형식을 파싱
    match = re.match(r'PT((?P<hours>\d+)H)?((?P<minutes>\d+)M)?((?P<seconds>\d+)S)?', duration_str)
    if not match: return 0
    h = int(match.group('hours') or 0)
    m = int(match.group('minutes') or 0)
    s = int(match.group('seconds') or 0)
    return h * 3600 + m * 60 + s

def _parse_videos(items):
    """
    유튜브 API 결과를 프론트엔드용으로 가공
    """
    results = []
    for item in items:
        video_id = ""
        if isinstance(item['id'], str):
            video_id = item['id']
        elif isinstance(item['id'], dict):
            video_id = item['id'].get('videoId')
        
        # snippet, statistics, contentDetails 정보 추출
        snippet = item.get('snippet', {})
        statistics = item.get('statistics', {})
        content_details = item.get('contentDetails', {})
        
        duration_sec = _parse_duration(content_details.get('duration', ''))
        # 60초 이하는 쇼츠로 간주
        is_short = duration_sec > 0 and duration_sec <= 60
        
        results.append({
            "id": video_id,
            "title": snippet.get('title'),
            "description": snippet.get('description'),
            "thumbnail": snippet.get('thumbnails', {}).get('medium', {}).get('url'),
            "channelTitle": snippet.get('channelTitle'),
            "publishedAt": snippet.get('publishedAt'),
            "viewCount": statistics.get('viewCount'),
            "duration": duration_sec,
            "isShort": is_short
        })
    return results

def search_videos(query: str, max_results: int = 50):
    """
    유튜브 영상 검색 (Cost: 100)
    """
    if not API_KEY:
        return {"error": "YouTube API 키가 없습니다."}

    encoded_query = urllib.parse.quote(query)
    # 검색 API는 statistics나 contentDetails를 직접 반환하지 않음 (100점 비용)
    # 따라서 searchResult에서는 viewCount, duration이 null일 수 있음
    url = f"{BASE_URL}/search?part=snippet&q={encoded_query}&maxResults={max_results}&type=video&key={API_KEY}"
    
    headers = {"Referer": "http://localhost:5173"}
    data, error = safe_http_get(url, headers=headers)
    
    if error:
        return {"error": error}
        
    remaining, limit = _manage_quota(cost=100)
        
    return {
        "items": _parse_videos(data.get('items', [])),
        "meta": {
            "remaining": str(remaining),
            "limit": str(limit)
        }
    }

def get_popular_videos(max_results: int = 50, category_id: str = None):
    """
    인기 동영상 목록 가져오기 (Cost: 1)
    - category_id가 있으면 해당 카테고리 인기 영상 조회
    """
    if not API_KEY:
        return {"error": "YouTube API 키가 없습니다."}
        
    # snippet, statistics, contentDetails(길이) 조회
    url = f"{BASE_URL}/videos?part=snippet,statistics,contentDetails&chart=mostPopular&maxResults={max_results}&regionCode=KR&key={API_KEY}"
    
    if category_id:
        url += f"&videoCategoryId={category_id}"
    
    headers = {"Referer": "http://localhost:5173"}
    data, error = safe_http_get(url, headers=headers)
    
    if error:
        return {"error": error}
        
    remaining, limit = _manage_quota(cost=1)
        
    return {
        "items": _parse_videos(data.get('items', [])),
        "meta": {
            "remaining": str(remaining),
            "limit": str(limit)
        }
    }
