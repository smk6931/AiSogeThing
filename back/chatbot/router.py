from fastapi import APIRouter, Depends
from core.database import fetch_all, fetch_one
from user.router import get_current_user
from user.models import User

router = APIRouter(prefix="/api/chatbot", tags=["Chatbot"])

# Helper to extract user_id
def get_user_id(current_user: dict = Depends(get_current_user)) -> int:
    return current_user["id"]

@router.post("/analyze")
async def analyze_taste(user_id: int = Depends(get_user_id)):
    """
    성향 분석: 유저의 시청 기록을 바탕으로 선호 카테고리/태그 추출
    """
    # 시청 기록 조회
    history_sql = """
        SELECT yl.category_id, yl.tags, yl.channel_title
        FROM user_youtube_logs uyl
        JOIN youtube_list yl ON uyl.video_id = yl.video_id
        WHERE uyl.user_id = :uid
        LIMIT 50
    """
    history = await fetch_all(history_sql, {"uid": user_id})
    
    if not history:
        return {"message": "아직 시청 기록이 없어요. 영상을 시청하고 돌아와주세요!"}
    
    # 간단한 집계 (나중에 AI로 확장)
    categories = {}
    tags_set = set()
    channels = set()
    
    for row in history:
        cat = row.get('category_id')
        if cat:
            categories[cat] = categories.get(cat, 0) + 1
        
        tags = row.get('tags', '')
        if tags:
            tags_set.update(tags.split(',')[:3])  # 상위 3개만
        
        ch = row.get('channel_title')
        if ch:
            channels.add(ch)
    
    # 가장 많이 본 카테고리
    top_cat = max(categories, key=categories.get) if categories else "알 수 없음"
    
    cat_names = {
        "10": "음악", "20": "게임", "24": "엔터테인먼트",
        "23": "코미디", "17": "스포츠", "22": "인물/블로그"
    }
    
    top_cat_name = cat_names.get(str(top_cat), "다양한")
    
    message = f"""📊 **당신의 시청 성향 분석**
    
주로 **{top_cat_name}** 카테고리를 선호하시네요!
관심 채널: {', '.join(list(channels)[:3])}
자주 등장하는 키워드: {', '.join(list(tags_set)[:5]) if tags_set else '분석 중...'}

총 {len(history)}개의 영상을 분석했어요. 계속 시청하시면 더 정확한 추천이 가능해집니다!"""
    
    return {"message": message}


@router.post("/recommend")
async def recommend_videos(user_id: int = Depends(get_user_id)):
    """
    영상 추천: 유저의 성향을 바탕으로 새로운 영상 추천
    """
    # 시청 기록 기반 카테고리 추출
    cat_sql = """
        SELECT yl.category_id
        FROM user_youtube_logs uyl
        JOIN youtube_list yl ON uyl.video_id = yl.video_id
        WHERE uyl.user_id = :uid
        GROUP BY yl.category_id
        ORDER BY COUNT(*) DESC
        LIMIT 1
    """
    cat_row = await fetch_one(cat_sql, {"uid": user_id})
    
    if not cat_row:
        # 시청 기록 없으면 인기 영상 추천
        rec_sql = """
            SELECT video_id, title, channel_title, view_count
            FROM youtube_list
            ORDER BY view_count DESC NULLS LAST
            LIMIT 5
        """
        recs = await fetch_all(rec_sql)
    else:
        # 선호 카테고리 기반 추천
        cat_id = cat_row['category_id']
        rec_sql = """
            SELECT video_id, title, channel_title, view_count
            FROM youtube_list
            WHERE category_id = :cat
              AND video_id NOT IN (
                  SELECT video_id FROM user_youtube_logs WHERE user_id = :uid
              )
            ORDER BY view_count DESC NULLS LAST
            LIMIT 5
        """
        recs = await fetch_all(rec_sql, {"cat": cat_id, "uid": user_id})
    
    if not recs:
        return {"message": "추천할 영상이 없어요. 조금만 기다려주세요!"}
    
    message = "🎬 **추천 영상**\n\n"
    for rec in recs:
        message += f"• {rec['title']} (by {rec['channel_title']})\n"
    
    return {"message": message}


@router.post("/match")
async def find_similar_users(user_id: int = Depends(get_user_id)):
    """
    유사 유저 찾기: 구독 채널 교집합 기반 매칭
    """
    # 내가 구독한 채널 목록
    my_channels_sql = """
        SELECT content_id FROM user_logs
        WHERE user_id = :uid 
          AND content_type = 'youtube_channel' 
          AND action = 'subscribe'
    """
    my_channels = await fetch_all(my_channels_sql, {"uid": user_id})
    my_ch_ids = {r['content_id'] for r in my_channels}
    
    if not my_ch_ids:
        return {"message": "먼저 채널을 구독해보세요! 그러면 취향이 비슷한 유저를 찾아드릴게요."}
    
    # 다른 유저들의 구독 채널과 비교
    others_sql = """
        SELECT ul.user_id, u.nickname, COUNT(*) as overlap
        FROM user_logs ul
        JOIN users u ON ul.user_id = u.id
        WHERE ul.content_type = 'youtube_channel'
          AND ul.action = 'subscribe'
          AND ul.user_id != :uid
          AND ul.content_id = ANY(:ch_ids)
        GROUP BY ul.user_id, u.nickname
        ORDER BY overlap DESC
        LIMIT 3
    """
    
    similar_users = await fetch_all(others_sql, {"uid": user_id, "ch_ids": list(my_ch_ids)})
    
    if not similar_users:
        return {"message": "아직 취향이 비슷한 유저를 찾지 못했어요. 더 많은 유저가 서비스를 이용하면 매칭이 가능해집니다!"}
    
    message = "👥 **취향이 비슷한 유저**\n\n"
    for user in similar_users:
        similarity = round((user['overlap'] / len(my_ch_ids)) * 100, 1)
        message += f"• {user['nickname']}님 (유사도: {similarity}%)\n"
    
    return {"message": message}


@router.post("/info")
async def service_info():
    """
    서비스 안내: AiSogeThing 기능 설명 (향후 RAG로 확장)
    """
    info_text = """🌟 **AiSogeThing 서비스 안내**

**주요 기능:**
1️⃣ **영상 피드**: 전 세계 11개국의 유튜브 인기 영상을 실시간으로 수집합니다.
2️⃣ **채널 관리**: 관심 있는 유튜브 채널을 구독하고 RSS로 신작을 빠르게 확인하세요.
3️⃣ **취향 분석**: 시청 기록을 바탕으로 당신의 성향을 분석해드립니다.
4️⃣ **개인화 추천**: AI가 당신의 취향에 맞는 영상을 추천합니다.

**데이터 수집 방식:**
- 무료 RSS + YouTube Data API 하이브리드 전략
- 하루 10,000 API 쿼터를 효율적으로 활용

궁금한 점이 있으시면 언제든지 물어보세요!"""
    
    return {"message": info_text}


@router.post("/chat")
async def chat(message: str, user_id: int = Depends(get_user_id)):
    """
    자유 대화 (향후 LLM 연동)
    """
    # 간단한 키워드 기반 응답 (MVP)
    keywords_map = {
        "구독": "구독 기능은 Youtube 탭에서 채널명 옆의 + 버튼을 누르시면 됩니다!",
        "추천": "영상 추천을 원하시면 위의 '영상 추천' 버튼을 눌러주세요.",
        "성향": "당신의 시청 성향을 분석하려면 '성향 분석' 버튼을 클릭하세요.",
        "안녕": "안녕하세요! 무엇을 도와드릴까요?",
        "감사": "천만에요! 즐거운 시청 되세요 😊"
    }
    
    for keyword, response in keywords_map.items():
        if keyword in message:
            return {"message": response}
    
    return {"message": "죄송합니다. 아직 학습 중이에요. 빠른 액션 버튼을 사용해보세요!"}
