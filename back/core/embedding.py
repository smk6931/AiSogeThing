import os
from openai import AsyncOpenAI
from langchain_community.embeddings import OpenAIEmbeddings
from typing import List

# OpenAI API 클라이언트 (비동기)
aclient = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def get_embedding(text: str) -> List[float]:
    """
    텍스트를 입력받아 1536차원 벡터 임베딩을 반환합니다.
    모델: text-embedding-3-small (가성비 & 성능 우수)
    """
    if not text:
        return [0.0] * 1536
    
    # 공백 제거 및 전처리
    text = text.replace("\n", " ")
    
    try:
        response = await aclient.embeddings.create(
            input=[text],
            model="text-embedding-3-small"
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"Embedding Error: {e}")
        # 에러 시 0 벡터 반환 (DB 저장 실패 방지)
        return [0.0] * 1536

async def get_embeddings(texts: List[str]) -> List[List[float]]:
    """여러 텍스트를 한 번에 임베딩 (배치 처리)"""
    if not texts:
        return []

    try:
        response = await aclient.embeddings.create(
            input=texts,
            model="text-embedding-3-small"
        )
        return [d.embedding for d in response.data]
    except Exception as e:
        print(f"Batch Embedding Error: {e}")
        return [[0.0] * 1536 for _ in texts]
