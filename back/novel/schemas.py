from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class NovelCutBase(BaseModel):
    cut_order: int
    scene_desc: Optional[str] = None
    image_path: Optional[str] = None

class NovelCutResponse(NovelCutBase):
    id: int
    novel_id: int

    class Config:
        from_attributes = True

class NovelBase(BaseModel):
    title: Optional[str] = None
    genre: Optional[str] = None
    script: Optional[str] = None

class NovelCreate(BaseModel):
    topic: str  # The prompt for generation

class NovelResponse(NovelBase):
    id: int
    created_at: datetime
    cuts: List[NovelCutResponse] = []

    class Config:
        from_attributes = True
