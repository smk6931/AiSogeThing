from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from hotplace.router import router as hotplace_router
from youtube.router import router as youtube_router
from user.router import router as user_router
from chatbot.router import router as chatbot_router

app = FastAPI()

# CORS 설정 (프론트엔드/클라우드 허용)
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173", # Vite 기본 포트도 추가 (혹시 몰라서)
    "*" # 개발 편의상 유지하되, 위 명시적 주소가 우선됨
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(hotplace_router)
app.include_router(youtube_router)
app.include_router(user_router)
app.include_router(chatbot_router)

@app.get("/")
def read_root():
    return {"message": "AiSogeThing Backend is running!"}
