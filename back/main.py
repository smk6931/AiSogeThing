from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from naver_client import NaverClient

app = FastAPI()

# CORS 설정 (프론트엔드 5173 포트 허용)
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

naver_client = NaverClient()

class SearchRequest(BaseModel):
    query: str

@app.get("/")
def read_root():
    return {"message": "AiSogeThing Backend is running!"}

@app.get("/api/search")
def search_place(query: str):
    """
    네이버 장소 검색 API
    """
    if not query:
        raise HTTPException(status_code=400, detail="검색어를 입력해주세요.")
    
    result = naver_client.search_place(query)
    
    if "error" in result:
        # 에러가 있다면 (API 키 미설정 등) 500 에러 반환하기보다
        # 200 OK로 보내고 프론트에서 에러 메시지를 보여주는 게 나을 수 있음
        # 여기서는 간단히 에러 내용을 반환
        return result
        
    # 결과 타입에 따라 반환 형식 조정
    if isinstance(result, list):
        return {"items": result}
    return result

# 실행 방법: uvicorn main:app --reload
