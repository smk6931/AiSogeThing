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
    limit = 10000
    
    saved_data = load_json_safe(quota_file)
    
    if saved_data and saved_data.get('date') == today:
        data = saved_data
    else:
        data = {"date": today, "remaining": limit, "limit": limit}
        
    if cost > 0:
        data['remaining'] = max(0, data['remaining'] - cost)
        save_json_safe(quota_file, data)
        
    return data['remaining'], limit

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
                "isShort": False
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
            {"id": "UCEwmUXNK69iAugMEahY7glA", "name": "김달"},
            {"id": "UCIfadKo7fcwSfgARMTz7xzA", "name": "나는 SOLO"},
            {"id": "UC0NLUpQMEbL71-a2-vhBOKQ", "name": "하트시그널"},
        ]
        
    all_videos = []
    for channel in target_channels:
        vids = get_channel_rss(channel['id'])
        for v in vids:
             v['channelTitle'] = channel['name']
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

def discover_new_channels():
    """
    AI 채널 발굴: '연애 유튜버'를 검색하여 새로운 채널을 JSON 목록에 자동 추가 (Cost: 100)
    """
    if not API_KEY: return {"error": "API Key Missing"}

    # 검색 쿼리
    query = "연애 코칭 상담"
    encoded_query = urllib.parse.quote(query)
    url = f"{BASE_URL}/search?part=snippet&q={encoded_query}&maxResults=10&type=channel&key={API_KEY}"
    
    headers = {"Referer": "http://localhost:5173"}
    data, error = safe_http_get(url, headers=headers)
    
    if error: return {"error": error}
    
    # Quota 차감
    remaining, limit = _manage_quota(cost=100)
    
    # 기존 채널 로드
    existing_channels = load_json_safe(CHANNELS_FILE) or []
    existing_ids = {ch['id'] for ch in existing_channels}
    
    added_count = 0
    
    # 결과 파싱 및 추가
    for item in data.get('items', []):
        c_id = item['snippet']['channelId']
        c_title = item['snippet']['channelTitle']
        
        if c_id not in existing_ids:
            existing_channels.append({"id": c_id, "name": c_title})
            existing_ids.add(c_id)
            added_count += 1
            
    # 저장
    save_json_safe(CHANNELS_FILE, existing_channels)
    
    return {
        "success": True,
        "added": added_count,
        "total": len(existing_channels),
        "channels": existing_channels,
        "meta": {"remaining": remaining, "limit": limit}
    }

def search_videos(query: str, max_results: int = 50):
    if not API_KEY:
        return {"error": "YouTube API 키가 없습니다."}

    encoded_query = urllib.parse.quote(query)
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
    if not API_KEY:
        return {"error": "YouTube API 키가 없습니다."}
        
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
