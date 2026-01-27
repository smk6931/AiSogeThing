from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from typing import List
import os

from novel.schemas import NovelCreate, NovelResponse
from novel import service
from novel.langgraph_workflow import generate_webtoon
from utils.safe_ops import handle_exceptions

router = APIRouter(
    prefix="/novel",
    tags=["Novel"],
    responses={404: {"description": "Not found"}},
)

@router.post("/generate", response_model=NovelResponse)
@handle_exceptions(default_message="웹툰 생성 실패")
async def generate_novel(request: NovelCreate):
    """
    AI 웹툰 생성 (LangGraph + GenAI)
    """
    # LangGraph 워크플로우 실행
    novel_id = await generate_webtoon(
        topic=request.topic,
        character_count=request.character_count,
        character_descriptions=request.character_descriptions,
        scene_count=request.scene_count,
        script_length=request.script_length
    )
    
    # 생성된 Novel 반환
    return await service.get_novel(novel_id)


@router.get("/{novel_id}", response_model=NovelResponse)
@handle_exceptions(default_message="웹툰 조회 실패")
async def get_novel(novel_id: int):
    novel = await service.get_novel(novel_id)
    if not novel:
        raise HTTPException(status_code=404, detail="Novel not found")
    return novel


@router.get("/", response_model=List[NovelResponse])
@handle_exceptions(default_message="웹툰 목록 조회 실패")
async def list_novels():
    return await service.list_novels()


# ========================================================
#  이미지 서빙 API
# ========================================================

@router.get("/image/character/{filename}")
async def get_character_image(filename: str):
    """캐릭터 이미지 조회"""
    file_path = os.path.join("static/generated/characters", filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(file_path, media_type="image/png")


@router.get("/image/scene/{filename}")
async def get_scene_image(filename: str):
    """씬 이미지 조회"""
    file_path = os.path.join("static/generated/scenes", filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(file_path, media_type="image/png")
