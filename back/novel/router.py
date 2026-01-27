from fastapi import APIRouter, HTTPException
from typing import List
from novel.schemas import NovelCreate, NovelResponse
from novel import service

router = APIRouter(
    prefix="/novel",
    tags=["Novel"],
    responses={404: {"description": "Not found"}},
)

@router.post("/generate", response_model=NovelResponse)
async def generate_novel(request: NovelCreate):
    """
    Start novel generation.
    Currently mocked to create DB entries and return them.
    LangGraph logic will be injected here later.
    """
    # 1. 소설 메인 생성
    novel = await service.create_novel(request.topic)
    
    # 2. (Mock) 4컷 생성 - 나중에 LangGraph가 할 일
    # 우선 임시로 모두 같은 이미지 사용
    # 사용자가 언급한 "백엔드 front/image 폴더"는 정적 파일 서빙을 의미하는 듯 함.
    # 프론트에서 /images/temp.png 로 접근 가능하다고 가정.
    
    mock_desc = [
        "Characters meeting for the first time.",
        "Conflict arises unexpectedly.",
        "Emotional moment in rain.",
        "Happy resolution."
    ]
    
    for i in range(1, 5):
        await service.create_novel_cut(
            novel_id=novel["id"],
            cut_order=i,
            scene_desc=mock_desc[i-1],
            # 임시 이미지 경로 (프론트 public 폴더 기준)
            image_path=f"/images/storyimage_{i}.png" # 프론트에서 이 파일을 넣어둬야 함
        )
    
    # 3. 전체 데이터 반환
    return await service.get_novel(novel["id"])

@router.get("/{novel_id}", response_model=NovelResponse)
async def get_novel(novel_id: int):
    novel = await service.get_novel(novel_id)
    if not novel:
        raise HTTPException(status_code=404, detail="Novel not found")
    return novel

@router.get("/", response_model=List[NovelResponse])
async def list_novels():
    # 목록 조회 시 cuts는 빈 배열로 나감 (service가 fetch 안하므로)
    return await service.list_novels()
