import os
import requests
from dotenv import load_dotenv
import urllib.parse

# .env 파일 로드
load_dotenv()

class NaverClient:
    def __init__(self):
        self.client_id = os.getenv("NAVER_CLIENT_ID")
        self.client_secret = os.getenv("NAVER_CLIENT_SECRET")
        self.base_url = "https://openapi.naver.com/v1/search/local.json"

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
        
        # API 호출 (sort=random: 유사도순, comment: mapx, mapy가 카텍이 아닌 위경도 좌표로 나오게 하려면 좌표 변환 필요하나
        # 네이버 검색 API는 12849203 처럼 정수형 좌표(KATECH 등)로 줌 -> TM128임.
        # 다행히 지도 표시용으로는 좌표계산이 필요하므로, 프론트엔드 호환을 위해 
        # 일단 API 데이터를 그대로 넘기고 프론트나 여기서 변환해야 함.
        # 그러나 Naver Search API 문서를 보면 mapx, mapy는 기본적으로 TM128 좌표계임.
        # 이를 위도/경도로 변환하려면 pyproj 같은 라이브러리가 필요함.
        # 여기서는 간단히 하기 위해 일단 값만 받아옴. (나중에 전처리 추가)
        
        url = f"{self.base_url}?query={encoded_query}&display={display}&sort=random"
        
        try:
            response = requests.get(url, headers=headers)
            if response.status_code == 200:
                data = response.json()
                return self._parse_items(data['items'])
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
            
            # mapx, mapy는 정수형 TM128 좌표로 옴. 
            # *팁: 네이버 검색 결과의 mapx, mapy는 천만 단위가 아니라 십만 단위일 수 있음.
            # 정확한 위경도 변환은 복잡하므로, 
            # 일단 네이버 지도 URL을 생성하는 것에 집중.
            
            # 네이버 지도 바로가기 URL 생성
            # https://map.naver.com/p/search/{검색어} 가 가장 안전함.
            
            place = {
                "title": title,
                "category": item['category'],
                "description": item['description'],
                "address": item['roadAddress'] or item['address'],
                "mapx": item['mapx'],
                "mapy": item['mapy'],
                "link": item['link'],
                "naver_map_url": f"https://map.naver.com/p/search/{urllib.parse.quote(title)}"
            }
            results.append(place)
        return results

# 테스트 코드
if __name__ == "__main__":
    client = NaverClient()
    print(client.search_place("성수동 카페"))
