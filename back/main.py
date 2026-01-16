from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from hotplace.router import router as hotplace_router
from youtube.router import router as youtube_router

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

# 라우터 등록
app.include_router(hotplace_router)
app.include_router(youtube_router)

@app.get("/")
def read_root():
    return {"message": "AiSogeThing Backend is running!"}
