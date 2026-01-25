from core.database import fetch_all
from client.openai_client import get_embedding_openai, generate_response_openai
from utils.safe_ops import safe_execute

async def analyze_user_context(user_id: int) -> str:
    """
    유저의 시청 기록과 구독 채널을 기반으로 'Context String' 생성
    """
    # 1. 최근 시청 기록 (상위 10개)
    log_sql = """
        SELECT yl.title, yl.channel_title, yl.tags
        FROM user_youtube_logs uyl
        JOIN youtube_list yl ON uyl.video_id = yl.video_id
        WHERE uyl.user_id = :uid
        ORDER BY uyl.updated_at DESC
        LIMIT 100
    """
    logs = await fetch_all(log_sql, {"uid": user_id})
    
    # 2. 구독 채널 (상위 5개)
    sub_sql = """
        SELECT yc.name, yc.keywords 
        FROM user_logs ul
        JOIN youtube_channels yc ON ul.content_id = yc.channel_id
        WHERE ul.user_id = :uid AND ul.action = 'subscribe'
        ORDER BY ul.created_at DESC
        LIMIT 100
    """
    subs = await fetch_all(sub_sql, {"uid": user_id})
    
    # Context 요약
    context_lines = []
    if logs:
        titles = [f"'{row['title']}'" for row in logs]
        context_lines.append(f"최근 시청 영상: {', '.join(titles)}")
    
    if subs:
        channels = [f"{row['name']}" for row in subs]
        context_lines.append(f"구독 채널: {', '.join(channels)}")
        
    return "\n".join(context_lines) if context_lines else "신규 유저 (시청 기록 없음)"

async def retrieve_videos(query_text: str, limit: int = 4):
    """
    [RAG] 질문과 유사한 영상을 벡터 유사도 검색으로 찾기
    """
    # 1. 질문 벡터화
    query_vector = await get_embedding_openai(query_text)
    
    # 2. 벡터 검색 (Cosine Distance: <=>)
    # pgvector 연산자: <=> (Distance), 1 - (<=>) = Similarity
    sql = """
        SELECT video_id, title, channel_title, description, 
               (1 - (embedding <=> :qv)) as similarity
        FROM youtube_list
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> :qv ASC
        LIMIT :limit
    """
    
    # safe_execute 리턴값이 context manager라 여기서는 직접 try-except가 나을 수도 있지만,
    # fetch_all 자체가 데이터베이스 레이어임.
    try:
        results = await fetch_all(sql, {"qv": str(query_vector), "limit": limit}) # 벡터는 문자열로 변환 전달
        return results
    except Exception as e:
        print(f"⚠️ Vector Search Error: {e}")
        return []

async def process_chat(user_id: int, message: str) -> str:
    """
    [Main Logic] 챗봇 대화 처리 (RAG + LLM)
    """
    # 1. 유저 컨텍스트 분석 (내 취향)
    user_context = await analyze_user_context(user_id)
    
    # 2. 관련 영상 검색 (RAG) - 질문과 관련된 영상 찾기
    # "재밌는 거 추천해줘" -> Context가 없으면 그냥 인기 영상이 나올 수도 있음.
    # 유저 질문에 '추천' 의도가 있으면 시청기록 기반 추천도 섞어야 함.
    relevant_videos = await retrieve_videos(message)
    
    video_context = ""
    if relevant_videos:
        video_infos = [f"- [{v['title']}] ({v['channel_title']}): {v['similarity']:.2f}" for v in relevant_videos]
        video_context = "관련 영상 DB 검색 결과:\n" + "\n".join(video_infos)
    
    # 3. 프롬프트 구성
    system_prompt = """
    당신은 'AiSogeThing'의 AI 큐레이터입니다.
    유저의 시청 기록과 질문 의도를 파악하여, 가장 적절한 답변과 영상 추천을 제공하세요.
    
    - 말투: 친근하고 위트 있게 (이모지 적절히 사용)
    - 형식: Markdown 문법 활용 (볼드체, 리스트 등)
    - 추천 시: 영상 제목을 강조하고, 왜 이 영상을 추천하는지 이유를 한 줄로 설명하세요.
    - 모르는 내용: "아직 잘 모르겠지만, 이런 건 어떠세요?"라며 DB 검색 결과를 활용하세요.
    """
    
    final_prompt = f"""
    [User Profile]
    {user_context}
    
    [DB Context (RAG)]
    {video_context}
    
    [User Message]
    {message}
    """
    
    # 4. LLM 답변 생성
    response = await generate_response_openai(final_prompt, system_role=system_prompt)
    return response
