import os
import requests
import json
from datetime import datetime
from dotenv import load_dotenv
import urllib.parse

# .env 파일 로드 (현재 폴더 또는 상위 폴더)
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    load_dotenv() # 기본 동작

class NaverClient:
    def __init__(self):
        self.client_id = os.getenv("NAVER_CLIENT_ID")
        self.client_secret = os.getenv("NAVER_CLIENT_SECRET")
        self.base_url = "https://openapi.naver.com/v1/search/local.json"

    def _manage_quota(self, increment=False):
        """
        로컬 파일(quota.json)을 이용해 API 사용량을 직접 카운팅합니다.
        네이버 검색 API가 헤더에 남은 횟수를 안 줄 때 유용합니다.
        """
        quota_file = os.path.join(os.path.dirname(__file__), 'quota.json')
        today = datetime.now().strftime('%Y-%m-%d')
        limit = 25000
        
        # 기본값
        data = {"date": today, "remaining": limit}

        # 파일 읽기
        try:
            if os.path.exists(quota_file):
                with open(quota_file, 'r', encoding='utf-8') as f:
                    saved_data = json.load(f)
                    # 날짜가 같으면 로드, 다르면 리셋(기본값 유지)
                    if saved_data.get('date') == today:
                        data = saved_data
        except Exception:
            pass # 읽기 실패 시 리셋

        # 사용량 차감
        if increment and data['remaining'] > 0:
            data['remaining'] -= 1
            # 파일 저장
            try:
                with open(quota_file, 'w', encoding='utf-8') as f:
                    json.dump(data, f)
            except Exception:
                pass

        return data['remaining'], limit

    def search_place(self, query: str, display: int = 5):
        """
        네이버 지역 검색 API를 호출합니다.
        :param query: 검색어 (예: 성수 다락)
        :param display: 검색 결과 출력 건수 (기본 5개)
        :return: 가공된 장소 리스트
        """
        if not self.client_id or not self.client_secret:
            return {"error": "API 키가 설정되지 않았습니다."}

        headers = {
            "X-Naver-Client-Id": self.client_id,
            "X-Naver-Client-Secret": self.client_secret
        }

        # 검색어 인코딩
        encoded_query = urllib.parse.quote(query)
        
        url = f"{self.base_url}?query={encoded_query}&display={display}&sort=random"
        
        try:
            response = requests.get(url, headers=headers)
            if response.status_code == 200:
                data = response.json()
                
                # API 호출 성공 시 카운트 차감 (로컬 관리)
                remaining, limit = self._manage_quota(increment=True)
                
                # 원본 데이터 로그 출력 (사용자 요청)
                print(f"\n🔍 [RAW RESPONSE] Query: {query}")
                print(json.dumps(data, indent=2, ensure_ascii=False))
                print("-" * 50)
                
                return {
                    "items": self._parse_items(data['items']),
                    "meta": {
                        "remaining": str(remaining),
                        "limit": str(limit)
                    }
                }
            else:
                return {"error": f"API 호출 실패: {response.status_code}", "detail": response.text}
        except Exception as e:
            return {"error": str(e)}

    def _parse_items(self, items):
        """
        API 결과를 프론트엔드에서 쓰기 편하게 가공
        """
        results = []
        for item in items:
            # HTML 태그 제거 (<b>성수</b> 등)
            title = item['title'].replace('<b>', '').replace('</b>', '')
            
            # mapx, mapy 처리 (1000만으로 나누면 위경도가 됨)
            try:
                lng = int(item['mapx']) / 10000000
                lat = int(item['mapy']) / 10000000
            except (ValueError, KeyError):
                lng, lat = 0.0, 0.0

            # 네이버 지도 바로가기 URL 생성
            place = {
                "title": title,
                "category": item['category'],
                "description": item['description'],
                "address": item['roadAddress'] or item['address'],
                "lat": lat,  # 위도
                "lng": lng,  # 경도
                "naver_map_url": f"https://map.naver.com/p/search/{urllib.parse.quote(title)}"
            }
            results.append(place)
        return results





# 테스트 코드
if __name__ == "__main__":
    import sys
    
    # 결과를 파일로 저장
    with open("debug.log", "w", encoding="utf-8") as f:
        client = NaverClient()
        f.write(f"\n===== [TEST LOG] =====\n")
        
        # 테스트: "잠실" 검색 (1개만)
        result_data = client.search_place("잠실", display=5)
        
        if "error" in result_data:
            f.write(f"Error: {result_data['error']}\n")
        else:
            items = result_data.get("items", [])
            f.write(f"Refined Result Count: {len(items)}\n")
            # ... (나머지 로그)
    
    print("Debug log saved to debug.log")
