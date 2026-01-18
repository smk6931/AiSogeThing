import re
import os
import urllib.parse
import requests
import xml.etree.ElementTree as ET
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
CHANNELS_FILE = os.path.join(os.path.dirname(__file__), 'dating_channels.json')

def save_interaction_log(log_data: dict):
    log_file = os.path.join(os.path.dirname(__file__), '..', 'logs', 'youtube_interaction.jsonl')
    log_data['timestamp'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    append_json_line(log_file, log_data)
    return True

def _manage_quota(cost=0):
    quota_file = os.path.join(os.path.dirname(__file__), 'youtube_quota.json')
    today = datetime.now().strftime('%Y-%m-%d')
    # 단순화: 파일 로드 실패시 기본값 사용
    data = load_json_safe(quota_file) or {"date": today, "remaining": 10000, "limit": 10000}
    
    if data.get('date') != today:
        data = {"date": today, "remaining": 10000, "limit": 10000}
        
    if cost > 0:
        data['remaining'] = max(0, int(data['remaining']) - cost)
        save_json_safe(quota_file, data)
        
    return data['remaining'], data['limit']

def _parse_duration(duration_str):
    if not duration_str: return 0
    match = re.match(r'PT((?P<hours>\d+)H)?((?P<minutes>\d+)M)?((?P<seconds>\d+)S)?', duration_str)
    if not match: return 0
    h = int(match.group('hours') or 0)
    m = int(match.group('minutes') or 0)
    s = int(match.group('seconds') or 0)
    return h * 3600 + m * 60 + s

def _parse_videos(items):
    results = []
    for item in items:
        video_id = ""
        if isinstance(item['id'], str):
            video_id = item['id']
        elif isinstance(item['id'], dict):
            video_id = item['id'].get('videoId')
        
        snippet = item.get('snippet', {})
        statistics = item.get('statistics', {})
        content_details = item.get('contentDetails', {})
        
        duration_sec = _parse_duration(content_details.get('duration', ''))
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

def get_channel_rss(channel_id: str):
    url = f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"
    try:
        response = requests.get(url, timeout=5)
        if response.status_code != 200:
            return []
            
        root = ET.fromstring(response.content)
        ns = {'atom': 'http://www.w3.org/2005/Atom', 'yt': 'http://www.youtube.com/xml/schemas/2015'}
        
        videos = []
        for entry in root.findall('atom:entry', ns):
            video_id = entry.find('yt:videoId', ns).text
            title = entry.find('atom:title', ns).text
            published = entry.find('atom:published', ns).text
            thumbnail = f"https://i.ytimg.com/vi/{video_id}/mqdefault.jpg"
            author = entry.find('atom:author', ns)
            channel_title = author.find('atom:name', ns).text if author is not None else "Unknown"

            videos.append({
                "id": video_id,
                "title": title,
                "description": "",
                "thumbnail": thumbnail,
                "channelTitle": channel_title,
                "publishedAt": published,
                "viewCount": None, 
                "duration": 0,
                "isShort": False,
                # RSS item doesn't come with channel ID, but we know it from context
                # "channelId": channel_id (Injected by caller)
            })
        return videos
    except Exception as e:
        print(f"RSS Parsing Error ({channel_id}): {e}")
        return []

def get_dating_videos():
    """
    JSON 파일에 저장된 연애 관련 유튜버들의 최신 영상을 RSS로 긁어옵니다. (Cost: 0)
    """
    target_channels = load_json_safe(CHANNELS_FILE) or []
    
    # fallback if empty
    if not target_channels:
         target_channels = [
            {"id": "UCEwmUXNK69iAugMEahY7glA", "name": "김달", "category": "reality"},
            {"id": "UCIfadKo7fcwSfgARMTz7xzA", "name": "나는 SOLO", "category": "reality"},
        ]
        
    all_videos = []
    for channel in target_channels:
        vids = get_channel_rss(channel['id'])
        for v in vids:
             v['channelTitle'] = channel['name']
             v['category'] = channel.get('category', 'reality') # 영상에도 카테고리 태깅
        all_videos.extend(vids)
    
    all_videos.sort(key=lambda x: x['publishedAt'], reverse=True)
    
    remaining, limit = _manage_quota(cost=0) # Read quota only
    
    return {
        "items": all_videos,
        "channels": target_channels,
        "meta": {
            "remaining": remaining,
            "limit": limit
        }
    }

def discover_new_channels(category: str = "reality"):
    """
    AI 채널 발굴: 카테고리에 맞는 연애 유튜버 검색 및 추가 (Cost: 100)
    category: 'reality' | 'sketch'
    """
    if not API_KEY: return {"error": "API Key Missing"}

    # 카테고리별 검색 쿼리
    queries = {
        "reality": "연애 심리 상담 코칭",
        "sketch": "연애 공감 스케치 코미디 숏박스"
    }
    query = queries.get(category, "연애 유튜버")
    
    encoded_query = urllib.parse.quote(query)
    url = f"{BASE_URL}/search?part=snippet&q={encoded_query}&maxResults=10&type=channel&key={API_KEY}"
    
    headers = {"Referer": "http://localhost:5173"}
    data, error = safe_http_get(url, headers=headers)
    
    if error: return {"error": error}
    
    remaining, limit = _manage_quota(cost=100)
    
    existing_channels = load_json_safe(CHANNELS_FILE) or []
    existing_ids = {ch['id'] for ch in existing_channels}
    
    added_count = 0
    
    for item in data.get('items', []):
        c_id = item['snippet']['channelId']
        c_title = item['snippet']['channelTitle']
        
        if c_id not in existing_ids:
            # 채널 추가 시 카테고리 명시
            existing_channels.append({"id": c_id, "name": c_title, "category": category})
            existing_ids.add(c_id)
            added_count += 1
            
    save_json_safe(CHANNELS_FILE, existing_channels)
    
    return {
        "success": True,
        "added": added_count,
        "category": category,
        "meta": {"remaining": remaining, "limit": limit}
    }

def search_videos(query: str, max_results: int = 50):
    if not API_KEY: return {"error": "No Key"}
    encoded_query = urllib.parse.quote(query)
    url = f"{BASE_URL}/search?part=snippet&q={encoded_query}&maxResults={max_results}&type=video&key={API_KEY}"
    headers = {"Referer": "http://localhost:5173"}
    data, error = safe_http_get(url, headers=headers)
    if error: return {"error": error}
    remaining, limit = _manage_quota(cost=100)
    return {"items": _parse_videos(data.get('items', [])), "meta": {"remaining": str(remaining), "limit": str(limit)}}

def get_popular_videos(max_results: int = 50, category_id: str = None):
    if not API_KEY: return {"error": "No Key"}
    url = f"{BASE_URL}/videos?part=snippet,statistics,contentDetails&chart=mostPopular&maxResults={max_results}&regionCode=KR&key={API_KEY}"
    if category_id: url += f"&videoCategoryId={category_id}"
    headers = {"Referer": "http://localhost:5173"}
    data, error = safe_http_get(url, headers=headers)
    if error: return {"error": error}
    remaining, limit = _manage_quota(cost=1)
    return {"items": _parse_videos(data.get('items', [])), "meta": {"remaining": str(remaining), "limit": str(limit)}}

# =========================================================
#  사용자 정의 관심사 RSS 로직 (Cost Optimization Strategy)
# =========================================================
INTEREST_CHANNELS_FILE = os.path.join(os.path.dirname(__file__), 'interest_channels.json')

def discover_interest_channels(keyword: str):
    """
    [Seed Step] 임의의 키워드로 채널을 검색하여 저장 (Cost: 100)
    """
    if not API_KEY: return {"error": "API Key Missing"}

    # 채널 검색
    encoded_query = urllib.parse.quote(keyword)
    url = f"{BASE_URL}/search?part=snippet&q={encoded_query}&maxResults=5&type=channel&key={API_KEY}"
    
    headers = {"Referer": "http://localhost:5173"}
    data, error = safe_http_get(url, headers=headers)
    
    if error: return {"error": error}
    
    # Quota 차감
    remaining, limit = _manage_quota(cost=100)
    
    # 저장소 로드
    existing_channels = load_json_safe(INTEREST_CHANNELS_FILE) or []
    existing_ids = {ch['id'] for ch in existing_channels}
    
    added_count = 0
    new_channels = []
    
    for item in data.get('items', []):
        c_id = item['snippet']['channelId']
        c_title = item['snippet']['channelTitle']
        
        # 이미 있는 채널이면 키워드 태그만 추가할 수도 있으나, 여기선 단순화하여 ID 중복만 체크
        if c_id not in existing_ids:
            new_ch = {
                "id": c_id, 
                "name": c_title, 
                "keywords": [keyword], 
                "addedAt": datetime.now().strftime('%Y-%m-%d')
            }
            existing_channels.append(new_ch)
            existing_ids.add(c_id)
            new_channels.append(c_title)
            added_count += 1
        else:
            # 기존 채널에 키워드 태그 추가
            for ch in existing_channels:
                if ch['id'] == c_id:
                    if keyword not in ch.get('keywords', []):
                        ch.setdefault('keywords', []).append(keyword)

    save_json_safe(INTEREST_CHANNELS_FILE, existing_channels)
    
    return {
        "success": True,
        "added": added_count,
        "channels": new_channels,
        "meta": {"remaining": remaining, "limit": limit}
    }

def get_interest_videos(target_keyword: str = None):
    """
    [Harvest Step] 저장된 관심 채널들의 RSS를 긁어옴 (Cost: 0)
    target_keyword: 특정 키워드 그룹만 보고 싶을 때 사용
    """
    all_channels = load_json_safe(INTEREST_CHANNELS_FILE) or []
    
    # 필터링
    target_channels = []
    if target_keyword:
        target_channels = [ch for ch in all_channels if target_keyword in ch.get('keywords', [])]
    else:
        target_channels = all_channels

    # RSS Fetch (Parallel/Concurrent 처리는 아니지만 빠름)
    all_videos = []
    for channel in target_channels:
        vids = get_channel_rss(channel['id'])
        for v in vids:
             v['channelTitle'] = channel['name']
             v['tags'] = channel.get('keywords', [])
        all_videos.extend(vids)
    
    # 최신순 정렬
    all_videos.sort(key=lambda x: x['publishedAt'], reverse=True)
    
    # Limit to latest 100
    return {
        "items": all_videos[:100], 
        "channels": target_channels,
        "channels_count": len(target_channels)
    }
