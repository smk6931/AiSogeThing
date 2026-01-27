import os
import json
import re
from typing import TypedDict, Annotated
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage

from novel.image_service import generate_character_image, generate_scene_image
from novel import service as novel_service

# ========================================================
#  LangGraph State 정의
# ========================================================

class WebtoonState(TypedDict):
    # 입력
    topic: str
    character_count: int
    character_descriptions: str
    scene_count: int
    script_length: str
    
    # 중간 결과
    full_script: str
    character_visuals: list[dict]  # [{name: str, description: str, image_path: str}]
    scenes: list[dict]  # [{order: int, text: str, image_path: str}]
    
    # 출력
    novel_id: int
    current_step: str


# ========================================================
#  Helper: GenAI Chat Model
# ========================================================

def get_llm(temperature=0.7):
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    return ChatGoogleGenerativeAI(
        model="gemini-2.0-flash-exp",  # 가장 저렴한 모델
        temperature=temperature,
        google_api_key=api_key
    )


# ========================================================
#  Node 1: ScriptWriter (줄거리 생성)
# ========================================================

async def script_writer_node(state: WebtoonState) -> WebtoonState:
    print("📝 Node 1: 줄거리 생성 중...")
    
    llm = get_llm(temperature=0.8)
    
    prompt = f"""
    다음 조건으로 {state['scene_count']}개의 씬(Scene)으로 구성된 로맨스 웹툰 스토리를 작성하세요.
    
    - 인물 수: {state['character_count']}명
    - 인물 설명: {state['character_descriptions']}
    - 줄거리 주제: {state['topic']}
    - 글 길이: {state['script_length']} (각 씬당 50-150 단어)
    
    형식:
    [Scene 1]
    (첫 번째 씬 내용)
    
    [Scene 2]
    (두 번째 씬 내용)
    
    ...
    
    각 씬은 감정과 행동이 명확하게 드러나도록 작성하고, 로맨틱한 분위기를 유지하세요.
    """
    
    messages = [HumanMessage(content=prompt)]
    response = await llm.ainvoke(messages)
    
    state["full_script"] = response.content
    state["current_step"] = "ScriptWriter 완료"
    
    print(f"✅ 줄거리 생성 완료 (길이: {len(response.content)}자)")
    return state


# ========================================================
#  Node 2: CharacterDesigner (인물 외형 묘사)
# ========================================================

async def character_designer_node(state: WebtoonState) -> WebtoonState:
    print("🎭 Node 2: 인물 외형 묘사 생성 중...")
    
    llm = get_llm(temperature=0.6)
    
    prompt = f"""
    다음 스토리의 등장인물들에 대해 이미지 생성에 적합한 구체적인 외형 묘사를 작성하세요.
    
    스토리:
    {state['full_script'][:500]}...
    
    기본 인물 설명:
    {state['character_descriptions']}
    
    {state['character_count']}명의 캐릭터 각각에 대해 다음을 JSON 배열로 반환하세요:
    [
        {{
            "name": "캐릭터 이름",
            "description": "나이, 성별, 헤어스타일, 눈 색깔, 체형, 의상 스타일, 분위기 등을 영문으로 상세히 묘사"
        }}
    ]
    
    JSON만 반환하고 다른 텍스트는 포함하지 마세요.
    """
    
    messages = [HumanMessage(content=prompt)]
    response = await llm.ainvoke(messages)
    
    # JSON 파싱
    try:
        # 코드 블록 제거 (```json ... ```)
        content = response.content.strip()
        if content.startswith("```"):
            content = re.sub(r'^```json\s*|\s*```$', '', content, flags=re.MULTILINE).strip()
        
        character_visuals = json.loads(content)
        state["character_visuals"] = character_visuals
        state["current_step"] = "CharacterDesigner 완료"
        
        print(f"✅ 인물 {len(character_visuals)}명 묘사 완료")
    except Exception as e:
        print(f"⚠️ JSON 파싱 실패: {e}")
        # Fallback: 빈 리스트
        state["character_visuals"] = []
    
    return state


# ========================================================
#  Node 3: CharacterImageGenerator (인물 이미지 생성)
# ========================================================

async def character_image_generator_node(state: WebtoonState) -> WebtoonState:
    print("🖼️ Node 3: 인물 이미지 생성 중...")
    
    for idx, character in enumerate(state["character_visuals"]):
        filename = await generate_character_image(
            character_name=character["name"],
            character_description=character["description"]
        )
        
        # API 엔드포인트로 변경
        if filename:
            character["image_path"] = f"/novel/image/character/{filename}"
        else:
            # Mock 경로
            character["image_path"] = f"/novel/image/character/mock_{idx}.png"
    
    state["current_step"] = "CharacterImageGenerator 완료"
    print(f"✅ 인물 이미지 {len(state['character_visuals'])}개 생성 완료")
    return state


# ========================================================
#  Node 4: SceneSplitter (씬 분할)
# ========================================================

async def scene_splitter_node(state: WebtoonState) -> WebtoonState:
    print("✂️ Node 4: 씬 분할 중...")
    
    # [Scene N] 태그로 분할
    script = state["full_script"]
    scene_pattern = r'\[Scene (\d+)\](.*?)(?=\[Scene \d+\]|$)'
    matches = re.findall(scene_pattern, script, re.DOTALL)
    
    scenes = []
    for order, text in matches:
        scenes.append({
            "order": int(order),
            "text": text.strip(),
            "image_path": None
        })
    
    # Scene 태그가 없는 경우 Fallback (강제 분할)
    if not scenes:
        print("⚠️ Scene 태그 없음. 균등 분할 시도...")
        words = script.split()
        chunk_size = len(words) // state["scene_count"]
        for i in range(state["scene_count"]):
            start = i * chunk_size
            end = start + chunk_size if i < state["scene_count"] - 1 else len(words)
            scenes.append({
                "order": i + 1,
                "text": " ".join(words[start:end]),
                "image_path": None
            })
    
    state["scenes"] = scenes
    state["current_step"] = "SceneSplitter 완료"
    
    print(f"✅ {len(scenes)}개 씬으로 분할 완료")
    return state


# ========================================================
#  Node 5: SceneImageGenerator (씬 이미지 생성)
# ========================================================

async def scene_image_generator_node(state: WebtoonState) -> WebtoonState:
    print("🎨 Node 5: 씬 이미지 생성 중...")
    
    for scene in state["scenes"]:
        filename = await generate_scene_image(
            scene_order=scene["order"],
            scene_text=scene["text"],
            character_visuals=state["character_visuals"]
        )
        
        # API 엔드포인트로 변경
        if filename:
            scene["image_path"] = f"/novel/image/scene/{filename}"
        else:
            scene["image_path"] = f"/novel/image/scene/mock_{scene['order']}.png"
    
    state["current_step"] = "SceneImageGenerator 완료"
    print(f"✅ 씬 이미지 {len(state['scenes'])}개 생성 완료")
    return state


# ========================================================
#  Node 6: DatabaseWriter (DB 저장)
# ========================================================

async def database_writer_node(state: WebtoonState) -> WebtoonState:
    print("💾 Node 6: DB 저장 중...")
    
    # 1. Novel 생성
    title = f"{state['topic'][:30]}..."
    novel = await novel_service.create_novel(topic=state["topic"])
    novel_id = novel["id"]
    
    # 2. 전체 스크립트 업데이트 (raw SQL)
    from core.database import execute
    await execute(
        "UPDATE novels SET script = :script WHERE id = :id",
        {"script": state["full_script"], "id": novel_id}
    )
    
    # 3. 각 씬 저장
    for scene in state["scenes"]:
        await novel_service.create_novel_cut(
            novel_id=novel_id,
            cut_order=scene["order"],
            scene_desc=scene["text"],
            image_path=scene["image_path"]
        )
    
    state["novel_id"] = novel_id
    state["current_step"] = "DatabaseWriter 완료"
    
    print(f"✅ DB 저장 완료 (Novel ID: {novel_id})")
    return state


# ========================================================
#  LangGraph 워크플로우 구성
# ========================================================

def create_webtoon_workflow():
    workflow = StateGraph(WebtoonState)
    
    # 노드 추가
    workflow.add_node("script_writer", script_writer_node)
    workflow.add_node("character_designer", character_designer_node)
    workflow.add_node("character_image_generator", character_image_generator_node)
    workflow.add_node("scene_splitter", scene_splitter_node)
    workflow.add_node("scene_image_generator", scene_image_generator_node)
    workflow.add_node("database_writer", database_writer_node)
    
    # 엣지 연결 (순차 실행)
    workflow.set_entry_point("script_writer")
    workflow.add_edge("script_writer", "character_designer")
    workflow.add_edge("character_designer", "character_image_generator")
    workflow.add_edge("character_image_generator", "scene_splitter")
    workflow.add_edge("scene_splitter", "scene_image_generator")
    workflow.add_edge("scene_image_generator", "database_writer")
    workflow.add_edge("database_writer", END)
    
    return workflow.compile()


# ========================================================
#  실행 함수
# ========================================================

async def generate_webtoon(
    topic: str,
    character_count: int = 2,
    character_descriptions: str = "",
    scene_count: int = 4,
    script_length: str = "medium"
) -> int:
    """
    웹툰 생성 워크플로우 실행
    
    Returns:
        novel_id: 생성된 Novel의 ID
    """
    print("="*60)
    print("🚀 웹툰 생성 워크플로우 시작")
    print("="*60)
    
    app = create_webtoon_workflow()
    
    initial_state = {
        "topic": topic,
        "character_count": character_count,
        "character_descriptions": character_descriptions,
        "scene_count": scene_count,
        "script_length": script_length,
        "full_script": "",
        "character_visuals": [],
        "scenes": [],
        "novel_id": 0,
        "current_step": "시작"
    }
    
    # 실행
    final_state = await app.ainvoke(initial_state)
    
    print("="*60)
    print(f"✅ 웹툰 생성 완료! Novel ID: {final_state['novel_id']}")
    print("="*60)
    
    return final_state["novel_id"]
